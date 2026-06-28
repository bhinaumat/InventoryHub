import express, { Request, Response } from 'express';
import { protect } from '../middleware/authMiddleware';
import prisma from '../prisma';

const router = express.Router();

// Get all clients
router.get('/', protect, async (req: Request, res: Response) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(clients);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Create a new client
router.post('/', protect, async (req: Request, res: Response) => {
    try {
        const { name, email, phone, company, type, status } = req.body;
        const newClient = await prisma.client.create({
            data: { name, email, phone, company, type, status }
        });
        res.status(201).json(newClient);
    } catch (err: any) {
        res.status(400).json({ message: 'Invalid data or client already exists' });
    }
});

// Delete a client
router.delete('/:id', protect, async (req: Request, res: Response): Promise<any> => {
    try {
        await prisma.client.delete({
            where: { id: req.params.id as string }
        });
        res.json({ message: 'Client deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
