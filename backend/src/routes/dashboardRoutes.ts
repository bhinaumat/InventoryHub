import express, { Request, Response } from 'express';
import { protect } from '../middleware/authMiddleware';
import prisma from '../prisma';

const router = express.Router();

router.get('/', protect, async (req: Request, res: Response) => {
    try {
        const totalProducts = await prisma.product.count();

        // Low stock items
        const inventories = await prisma.inventory.findMany({ include: { product: true } });
        let lowStockCount = 0;
        inventories.forEach((inv: any) => {
            const prod = inv.product as any;
            if (prod.reorderLevel && inv.quantity <= prod.reorderLevel) {
                lowStockCount++;
            }
        });

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
