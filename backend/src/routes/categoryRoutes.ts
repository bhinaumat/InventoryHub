import express, { Request, Response } from 'express';
import { protect, managerOnly } from '../middleware/authMiddleware';
import prisma from '../prisma';

const router = express.Router();

router.get('/', protect, async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany();
        res.json(categories);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/', protect, managerOnly, async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, description } = req.body;
        let category = await prisma.category.findUnique({ where: { name } });
        if (category) return res.status(400).json({ message: 'Category already exists' });

        category = await prisma.category.create({
            data: { name, description }
        });
        res.status(201).json(category);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
