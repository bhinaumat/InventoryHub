import { Request, Response, NextFunction } from 'express';
import jsonwebtoken from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ims-secret-key-1234';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }

    try {
        const decoded = jsonwebtoken.verify(token, JWT_SECRET) as any;
        req.user = decoded.user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
        return;
    }
};

export const managerOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user && req.user.role === 'Manager') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as Manager' });
        return;
    }
};
