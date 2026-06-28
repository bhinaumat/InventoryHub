import express, { Request, Response } from 'express';
import { protect, managerOnly } from '../middleware/authMiddleware';
import prisma from '../prisma';

const router = express.Router();

router.get('/', protect, async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            include: { category: true }
        });
        res.json(products);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/', protect, managerOnly, async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, sku, category, unitOfMeasure, reorderLevel, price } = req.body;

        let product = await prisma.product.findUnique({ where: { sku } });
        if (product) return res.status(400).json({ message: 'Product with this SKU already exists' });

        product = await prisma.product.create({
            data: { name, sku, categoryId: category, unitOfMeasure, reorderLevel, price: Number(price) || 0 }
        });
        res.status(201).json(product);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/:id/inventory', protect, async (req: Request, res: Response): Promise<any> => {
    try {
        const inventory = await prisma.inventory.findMany({
            where: { productId: req.params.id as string },
            include: { location: true }
        });
        res.json(inventory);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.delete('/:id', protect, managerOnly, async (req: Request, res: Response): Promise<any> => {
    try {
        await prisma.product.delete({
            where: { id: req.params.id as string }
        });
        res.json({ message: 'Product deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
