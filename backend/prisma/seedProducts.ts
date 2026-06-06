import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create or Find Categories
  const categoriesData = [
    { name: 'Raw Materials', description: 'Basic materials for manufacturing' },
    { name: 'Electronics', description: 'Consumer and industrial electronics' },
    { name: 'Agriculture', description: 'Farming and food staples' },
    { name: 'Textiles', description: 'Fabrics and woven materials' }
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categoryMap.set(cat.name, createdCat.id);
  }

  // Create Products
  const productsData = [
    { name: 'Industrial Steel Coils', sku: 'IMP-STL-001', categoryId: categoryMap.get('Raw Materials')!, unitOfMeasure: 'Tons', price: 850.00, reorderLevel: 50 },
    { name: 'Aluminum Ingots', sku: 'IMP-ALU-002', categoryId: categoryMap.get('Raw Materials')!, unitOfMeasure: 'Tons', price: 2100.00, reorderLevel: 20 },
    { name: 'Solar Panels (400W)', sku: 'EXP-SOL-001', categoryId: categoryMap.get('Electronics')!, unitOfMeasure: 'Units', price: 180.50, reorderLevel: 100 },
    { name: 'Microcontroller Chips', sku: 'IMP-MCU-005', categoryId: categoryMap.get('Electronics')!, unitOfMeasure: 'Thousand Units', price: 1200.00, reorderLevel: 5 },
    { name: 'Robusta Coffee Beans', sku: 'EXP-COF-001', categoryId: categoryMap.get('Agriculture')!, unitOfMeasure: 'Bags (60kg)', price: 150.00, reorderLevel: 200 },
    { name: 'Refined Soybean Oil', sku: 'EXP-SOY-002', categoryId: categoryMap.get('Agriculture')!, unitOfMeasure: 'Barrels', price: 950.00, reorderLevel: 50 },
    { name: 'Raw Silk Fabric', sku: 'IMP-SIL-001', categoryId: categoryMap.get('Textiles')!, unitOfMeasure: 'Rolls', price: 320.00, reorderLevel: 40 },
    { name: 'Organic Cotton Bales', sku: 'EXP-COT-001', categoryId: categoryMap.get('Textiles')!, unitOfMeasure: 'Bales', price: 420.00, reorderLevel: 100 },
    { name: 'Medical Grade Silicon', sku: 'IMP-SIL-002', categoryId: categoryMap.get('Raw Materials')!, unitOfMeasure: 'Kg', price: 45.00, reorderLevel: 500 },
    { name: 'Lithium-Ion Battery Packs', sku: 'EXP-BAT-001', categoryId: categoryMap.get('Electronics')!, unitOfMeasure: 'Pallets', price: 15000.00, reorderLevel: 10 },
  ];

  console.log(`Inserting ${productsData.length} products...`);
  for (const prod of productsData) {
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: prod,
      create: prod,
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
