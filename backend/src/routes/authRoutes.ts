import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import prisma from '../prisma';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ims-secret-key-1234';

// Mock Email sender
const sendEmail = async (email: string, subject: string, text: string) => {
    console.log(`\n=== MOCK EMAIL SENT ===\nTo: ${email}\nSubject: ${subject}\nText: ${text}\n========================\n`);
};

router.post('/register', async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, email, password, role } = req.body;
        let user = await prisma.user.findUnique({ where: { email } });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        user = await prisma.user.create({
            data: { name, email, passwordHash, role }
        });

        const payload = { user: { id: user.id, role: user.role } };
        const token = jsonwebtoken.sign(payload, JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/login', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

        await prisma.user.update({
            where: { email },
            data: { otpCode, otpExpiry }
        });

        await sendEmail(email, 'Login OTP Verification', `Your login OTP is: ${otpCode}`);

        res.json({ message: 'OTP sent to email (check server console)', requireOtp: true, email: user.email });
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/verify-login-otp', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, otpCode } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.otpCode || !user.otpExpiry) {
            return res.status(400).json({ message: 'OTP session expired or invalid request' });
        }

        if (user.otpCode !== otpCode || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Clear OTP after successful verification
        await prisma.user.update({
            where: { email },
            data: { otpCode: null, otpExpiry: null }
        });

        const payload = { user: { id: user.id, role: user.role } };
        const token = jsonwebtoken.sign(payload, JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/forgot-password', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        
        await prisma.user.update({
            where: { email },
            data: { otpCode, otpExpiry }
        });

        await sendEmail(email, 'Password Reset OTP', `Your OTP for password reset is: ${otpCode}`);

        res.json({ message: 'OTP sent to email (check server console)' });
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/reset-password', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, otpCode, newPassword } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.otpCode || !user.otpExpiry) {
            return res.status(400).json({ message: 'Invalid request' });
        }

        if (user.otpCode !== otpCode || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        
        await prisma.user.update({
            where: { email },
            data: {
                passwordHash,
                otpCode: null,
                otpExpiry: null
            }
        });

        res.json({ message: 'Password reset successfully. You can now login.' });
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
