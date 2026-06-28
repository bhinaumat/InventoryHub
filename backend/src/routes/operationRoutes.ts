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

        if (!referenceNumber || !type) {
            return res.status(400).json({ message: 'Reference number and type are required' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'At least one item is required' });
        }
        
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
        if (op.status === 'Cancelled') return res.status(400).json({ message: 'Cannot validate a cancelled operation' });

        await prisma.$transaction(async (tx) => {
            // Iterate over items and validate logic
            for (const item of op.items) {
                if (op.type === 'Import' && op.destLocationId) {
                    // Increase stock
                    await tx.inventory.upsert({
                        where: {
                            productId_locationId: { productId: item.productId, locationId: op.destLocationId }
                        },
                        update: { quantity: { increment: item.quantity } },
                        create: { productId: item.productId, locationId: op.destLocationId, quantity: item.quantity }
                    });

                    await tx.stockLedger.create({
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
                    const inv = await tx.inventory.findUnique({
                        where: {
                            productId_locationId: { productId: item.productId, locationId: op.sourceLocationId }
                        }
                    });
                    
                    if (!inv || inv.quantity < item.quantity) {
                        throw new Error(`Insufficient stock for product ${item.productId}`);
                    }

                    await tx.inventory.update({
                        where: { id: inv.id },
                        data: { quantity: { decrement: item.quantity } }
                    });

                    await tx.stockLedger.create({
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
                    const invSource = await tx.inventory.findUnique({
                        where: {
                            productId_locationId: { productId: item.productId, locationId: op.sourceLocationId }
                        }
                    });
                    
                    if (!invSource || invSource.quantity < item.quantity) {
                        throw new Error(`Insufficient stock at source for product ${item.productId}`);
                    }

                    await tx.inventory.update({
                        where: { id: invSource.id },
                        data: { quantity: { decrement: item.quantity } }
                    });

                    await tx.inventory.upsert({
                        where: {
                            productId_locationId: { productId: item.productId, locationId: op.destLocationId }
                        },
                        update: { quantity: { increment: item.quantity } },
                        create: { productId: item.productId, locationId: op.destLocationId, quantity: item.quantity }
                    });

                    await tx.stockLedger.create({
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

                    const inv = await tx.inventory.findUnique({
                        where: {
                            productId_locationId: { productId: item.productId, locationId: locationId }
                        }
                    });
                    const oldQty = inv ? inv.quantity : 0;
                    const diff = item.quantity - oldQty;

                    if (diff !== 0) {
                        await tx.inventory.upsert({
                            where: {
                                productId_locationId: { productId: item.productId, locationId: locationId }
                            },
                            update: { quantity: item.quantity },
                            create: { productId: item.productId, locationId: locationId, quantity: item.quantity }
                        });

                        await tx.stockLedger.create({
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

            await tx.operation.update({
                where: { id: op.id },
                data: { status: 'Done' }
            });
        });

        const updatedOp = await prisma.operation.findUnique({
            where: { id: op.id },
            include: {
                sourceLocation: true,
                destLocation: true,
                items: { include: { product: true } }
            }
        });
        
        res.json(updatedOp);
    } catch (err: any) {
        res.status(400).json({ message: err.message || 'Server Error' });
    }
});

export default router;
