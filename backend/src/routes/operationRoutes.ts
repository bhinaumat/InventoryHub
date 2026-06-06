import express, { Request, Response } from 'express';
import { protect, managerOnly } from '../middleware/authMiddleware';
import prisma from '../prisma';

const router = express.Router();

router.get('/', protect, async (req: Request, res: Response) => {
    try {
        const operations = await prisma.operation.findMany({
            include: {
                sourceLocation: true,
                destLocation: true,
                items: { include: { product: true } }
            }
        });
        res.json(operations);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/', protect, async (req: Request, res: Response): Promise<any> => {
    try {
        const { referenceNumber, type, sourceLocation, destLocation, items, notes } = req.body;
        
        const op = await prisma.operation.create({
            data: {
                referenceNumber,
                type,
                sourceLocationId: sourceLocation || null,
                destLocationId: destLocation || null,
                notes,
                status: 'Draft',
                items: {
                    create: items.map((item: any) => ({
                        productId: item.product,
                        quantity: Number(item.quantity)
                    }))
                }
            },
            include: { items: true }
        });
        
        res.status(201).json(op);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

router.put('/:id/validate', protect, managerOnly, async (req: Request, res: Response): Promise<any> => {
    try {
        const opId = req.params.id as string;
        const op = await prisma.operation.findUnique({
            where: { id: opId },
            include: { items: true }
        });

        if (!op) return res.status(404).json({ message: 'Operation not found' });
        if (op.status === 'Done') return res.status(400).json({ message: 'Already validated' });

        // Iterate over items and validate logic
        for (const item of op.items) {
            if (op.type === 'Import' && op.destLocationId) {
                // Increase stock
                await prisma.inventory.upsert({
                    where: {
                        productId_locationId: { productId: item.productId, locationId: op.destLocationId }
                    },
                    update: { quantity: { increment: item.quantity } },
                    create: { productId: item.productId, locationId: op.destLocationId, quantity: item.quantity }
                });

                await prisma.stockLedger.create({
                    data: {
                        productId: item.productId,
                        quantity: item.quantity,
                        destLocationId: op.destLocationId,
                        operationType: 'Import',
                        referenceDocumentId: op.id
                    }
                });
            }

            if (op.type === 'Export' && op.sourceLocationId) {
                // Decrease stock
                const inv = await prisma.inventory.findUnique({
                    where: {
                        productId_locationId: { productId: item.productId, locationId: op.sourceLocationId }
                    }
                });
                
                if (!inv || inv.quantity < item.quantity) {
                    return res.status(400).json({ message: `Insufficient stock for product ${item.productId}` });
                }

                await prisma.inventory.update({
                    where: { id: inv.id },
                    data: { quantity: { decrement: item.quantity } }
                });

                await prisma.stockLedger.create({
                    data: {
                        productId: item.productId,
                        quantity: -item.quantity,
                        sourceLocationId: op.sourceLocationId,
                        operationType: 'Export',
                        referenceDocumentId: op.id
                    }
                });
            }

            if (op.type === 'Transfer' && op.sourceLocationId && op.destLocationId) {
                // Decrease source, increase dest
                const invSource = await prisma.inventory.findUnique({
                    where: {
                        productId_locationId: { productId: item.productId, locationId: op.sourceLocationId }
                    }
                });
                
                if (!invSource || invSource.quantity < item.quantity) {
                    return res.status(400).json({ message: `Insufficient stock at source for product ${item.productId}` });
                }

                await prisma.inventory.update({
                    where: { id: invSource.id },
                    data: { quantity: { decrement: item.quantity } }
                });

                await prisma.inventory.upsert({
                    where: {
                        productId_locationId: { productId: item.productId, locationId: op.destLocationId }
                    },
                    update: { quantity: { increment: item.quantity } },
                    create: { productId: item.productId, locationId: op.destLocationId, quantity: item.quantity }
                });

                await prisma.stockLedger.create({
                    data: {
                        productId: item.productId,
                        quantity: item.quantity,
                        sourceLocationId: op.sourceLocationId,
                        destLocationId: op.destLocationId,
                        operationType: 'Transfer',
                        referenceDocumentId: op.id
                    }
                });
            }

            if (op.type === 'Adjustment') {
                const locationId = op.sourceLocationId || op.destLocationId;
                if (!locationId) continue;

                const inv = await prisma.inventory.findUnique({
                    where: {
                        productId_locationId: { productId: item.productId, locationId: locationId }
                    }
                });
                const oldQty = inv ? inv.quantity : 0;
                const diff = item.quantity - oldQty;

                if (diff !== 0) {
                    await prisma.inventory.upsert({
                        where: {
                            productId_locationId: { productId: item.productId, locationId: locationId }
                        },
                        update: { quantity: item.quantity },
                        create: { productId: item.productId, locationId: locationId, quantity: item.quantity }
                    });

                    await prisma.stockLedger.create({
                        data: {
                            productId: item.productId,
                            quantity: diff,
                            sourceLocationId: locationId,
                            operationType: 'Adjustment',
                            referenceDocumentId: op.id
                        }
                    });
                }
            }
        }

        const updatedOp = await prisma.operation.update({
            where: { id: op.id },
            data: { status: 'Done' }
        });
        
        res.json(updatedOp);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

export default router;
