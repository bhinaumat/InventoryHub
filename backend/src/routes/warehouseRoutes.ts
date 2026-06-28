import express, { Request, Response } from 'express';
import { protect, managerOnly } from '../middleware/authMiddleware';
import prisma from '../prisma';

const router = express.Router();

router.get('/', protect, async (req: Request, res: Response) => {
    try {
        const warehouses = await prisma.warehouse.findMany();
        res.json(warehouses);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/', protect, managerOnly, async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, address } = req.body;
        let warehouse = await prisma.warehouse.findUnique({ where: { name } });
        if (warehouse) return res.status(400).json({ message: 'Warehouse already exists' });

        warehouse = await prisma.warehouse.create({
            data: { name, address }
        });
        res.status(201).json(warehouse);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.delete('/:id', protect, managerOnly, async (req: Request, res: Response): Promise<any> => {
    try {
        await prisma.warehouse.delete({
            where: { id: req.params.id as string }
        });
        res.json({ message: 'Warehouse deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
