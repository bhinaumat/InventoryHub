import express, { Request, Response } from 'express';
import { protect } from '../middleware/authMiddleware';
import prisma from '../prisma';

const router = express.Router();

router.get('/', protect, async (req: Request, res: Response) => {
    try {
        const totalProducts = await prisma.product.count();

        // Low stock items
        const result = await prisma.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*) as count 
            FROM "Inventory" i
            JOIN "Product" p ON i."productId" = p."id"
            WHERE i."quantity" <= p."reorderLevel" AND p."reorderLevel" > 0
        `;
        const lowStockCount = Number(result[0]?.count || 0);

        const pendingImports = await prisma.operation.count({ where: { type: 'Import', status: { not: 'Done' } } });
        const pendingExports = await prisma.operation.count({ where: { type: 'Export', status: { not: 'Done' } } });
        const pendingTransfers = await prisma.operation.count({ where: { type: 'Transfer', status: { not: 'Done' } } });

        res.json({
            totalProducts,
            lowStockCount,
            pendingImports,
            pendingExports,
            pendingTransfers
        });
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
