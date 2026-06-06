import express, { Request, Response } from 'express';
import { protect } from '../middleware/authMiddleware';
import prisma from '../prisma';

const router = express.Router();

router.get('/', protect, async (req: Request, res: Response) => {
    try {
        const history = await prisma.stockLedger.findMany({
            include: {
                product: true,
                sourceLocation: true,
                destLocation: true,
                referenceDocument: true
            },
            orderBy: { date: 'desc' }
        });
        res.json(history);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
