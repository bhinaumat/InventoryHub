import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const randomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

const seedData = async () => {
    try {
        console.log('Clearing existing data...');
        await prisma.stockLedger.deleteMany();
        await prisma.operationItem.deleteMany();
        await prisma.operation.deleteMany();
        await prisma.inventory.deleteMany();
        await prisma.location.deleteMany();
        await prisma.warehouse.deleteMany();
        await prisma.product.deleteMany();
        await prisma.category.deleteMany();
        await prisma.user.deleteMany();

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('password123', salt);

        // 1. Create Manager
        await prisma.user.create({
            data: {
                name: 'Global Operations Admin',
                email: 'admin@nexims.com',
                passwordHash: hash,
                role: 'Manager'
            }
        });
        console.log('User created: admin@nexims.com / password123');

        // 2. Categories
        console.log('Creating Categories & Global Commodities...');
        const categories = await Promise.all([
            prisma.category.create({ data: { name: 'Industrial Machinery', description: 'Heavy equipment and parts' } }),
            prisma.category.create({ data: { name: 'Raw Textiles', description: 'Bales of cotton and synthetic fibers' } }),
            prisma.category.create({ data: { name: 'Bulk Electronics', description: 'Consumer electronics pallets' } }),
            prisma.category.create({ data: { name: 'Automotive Parts', description: 'Engines and chassis components' } }),
        ]);

        const prodTemplates = [
            { name: 'CNC Lathe Machine XT', category: 0, price: 45000 },
            { name: 'Hydraulic Press 500T', category: 0, price: 120000 },
            { name: 'Industrial Generator Set', category: 0, price: 30000 },
            { name: 'High-Grade Cotton Bales', category: 1, price: 850 },
            { name: 'Synthetic Nylon Rolls', category: 1, price: 2500 },
            { name: 'Silk Fabric (Pallet)', category: 1, price: 5000 },
            { name: 'Smartphone Modules (Bulk)', category: 2, price: 150000 },
            { name: 'LED Display Panels (Lot)', category: 2, price: 35000 },
            { name: 'Microprocessor Trays', category: 2, price: 80000 },
            { name: 'Lithium-Ion Battery Packs', category: 2, price: 45000 },
            { name: 'Fiber Optic Spools', category: 2, price: 12000 },
            { name: 'V8 Engine Blocks', category: 3, price: 25000 },
            { name: 'Heavy Duty Truck Axles', category: 3, price: 5000 },
            { name: 'Alloy Wheels Set (Pallet)', category: 3, price: 15000 },
        ];

        const products = await Promise.all(
            prodTemplates.map((p, i) => prisma.product.create({
                data: {
                    name: p.name,
                    sku: `SKU-${1000 + i}`,
                    categoryId: categories[p.category].id,
                    reorderLevel: randomInt(10, 50),
                    price: p.price
                }
            }))
        );

        // 3. Warehouses and Locations
        console.log('Creating Ports & Hubs...');
        const mainWh = await prisma.warehouse.create({
            data: { name: 'Port of Long Beach', address: 'Long Beach, CA, USA' }
        });
        const regWh = await prisma.warehouse.create({
            data: { name: 'Rotterdam Customs Hub', address: 'Rotterdam, Netherlands' }
        });

        // Supplier/Customer virtual locations
        const supplierLoc = await prisma.location.create({ data: { name: 'Overseas Suppliers (Virtual)', warehouseId: mainWh.id } });
        const customerLoc = await prisma.location.create({ data: { name: 'FOB Destinations (Virtual)', warehouseId: mainWh.id } });

        const mainDock = await prisma.location.create({ data: { name: 'Container Terminal 1', warehouseId: mainWh.id } });
        const mainStorage = await prisma.location.create({ data: { name: 'Customs Holding Area A', warehouseId: mainWh.id } });
        const regStorage = await prisma.location.create({ data: { name: 'European Distribution Zone', warehouseId: regWh.id } });
        
        const internalLocations = [mainDock.id, mainStorage.id, regStorage.id];

        // 4. Simulate History (2 Years)
        console.log('Simulating 2 years of global trade history (~800 operations)...');
        
        let inventoryState: Record<string, number> = {}; 
        
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const now = new Date();

        let operationDates = [];
        for (let i = 0; i < 800; i++) {
            operationDates.push(randomDate(twoYearsAgo, now));
        }
        operationDates.sort((a, b) => a.getTime() - b.getTime());

        let operationCount = 0;

        for (const opDate of operationDates) {
            let typeProb = Math.random();
            let type;
            let sourceId: string | null = null;
            let destId: string | null = null;

            if (operationCount < 100) { type = 'Import'; }
            else if (typeProb < 0.4) { type = 'Import'; }
            else if (typeProb < 0.8) { type = 'Export'; }
            else if (typeProb < 0.95) { type = 'Transfer'; }
            else { type = 'Adjustment'; }

            if (type === 'Import') {
                sourceId = supplierLoc.id;
                destId = internalLocations[randomInt(0, internalLocations.length - 1)];
            } else if (type === 'Export') {
                sourceId = internalLocations[randomInt(0, internalLocations.length - 1)];
                destId = customerLoc.id;
            } else if (type === 'Transfer') {
                sourceId = mainStorage.id;
                destId = regStorage.id;
            } else { // Adjustment
                sourceId = null; 
                destId = internalLocations[randomInt(0, internalLocations.length - 1)];
            }

            const numItems = randomInt(1, 3);
            const items = [];
            for (let j = 0; j < numItems; j++) {
                const prod = products[randomInt(0, products.length - 1)];
                const invKeySource = sourceId ? `${prod.id}|${sourceId}` : null;
                const invKeyDest = destId ? `${prod.id}|${destId}` : null;

                let qty = randomInt(5, 50);

                if (type === 'Export' || type === 'Transfer') {
                    const currentStock = inventoryState[invKeySource!] || 0;
                    if (currentStock <= 0) continue; 
                    qty = Math.min(qty, currentStock);
                    inventoryState[invKeySource!] -= qty;
                }

                if (invKeyDest) {
                    inventoryState[invKeyDest] = (inventoryState[invKeyDest] || 0) + qty;
                }

                items.push({ productId: prod.id, quantity: qty });
            }

            if (items.length === 0) continue; 

            operationCount++;
            
            const op = await prisma.operation.create({
                data: {
                    referenceNumber: `${type.toUpperCase()}-${opDate.getFullYear()}${String(opDate.getMonth()+1).padStart(2,'0')}-${10000 + operationCount}`,
                    type,
                    status: 'Done',
                    sourceLocationId: sourceId,
                    destLocationId: destId,
                    date: opDate,
                    createdAt: opDate,
                    updatedAt: opDate,
                    items: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity
                        }))
                    }
                }
            });

            for (const item of items) {
                await prisma.stockLedger.create({
                    data: {
                        date: opDate,
                        productId: item.productId,
                        quantity: item.quantity,
                        sourceLocationId: sourceId,
                        destLocationId: destId,
                        operationType: type,
                        referenceDocumentId: op.id,
                        createdAt: opDate,
                        updatedAt: opDate
                    }
                });
            }

            if (operationCount % 100 === 0) {
                console.log(`Generated ${operationCount} operations...`);
            }
        }

        console.log('Materializing current port inventories...');
        const inventoryRecords = [];
        for (const [key, qty] of Object.entries(inventoryState)) {
            if (qty > 0) {
                const [productId, locationId] = key.split('|');
                inventoryRecords.push({ productId, locationId, quantity: qty });
            }
        }

        await prisma.inventory.createMany({
            data: inventoryRecords
        });

        console.log(`Success! Seeded ${operationCount} global trade operations over 2 years.`);
        process.exit(0);
    } catch (error) {
        console.error('Error with global trade seed', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
};

seedData();
