import express, { Request, Response } from 'express';
import { protect, managerOnly } from '../middleware/authMiddleware';
import prisma from '../prisma';

const router = express.Router();

router.get('/', protect, async (req: Request, res: Response) => {
    try {
        const locations = await prisma.location.findMany({
            include: { warehouse: true }
        });
        res.json(locations);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/', protect, managerOnly, async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, warehouse } = req.body;
        const location = await prisma.location.create({
            data: { name, warehouseId: warehouse }
        });
        res.status(201).json(location);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

export default router;
