import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import prisma from '../prisma';
import { sendOTP } from '../services/smsService';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ims-secret-key-1234';

// Generate a 6-digit OTP
const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

router.post('/register', async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const role = 'Staff'; // Force role — only admins can promote
        let user = await prisma.user.findUnique({ where: { email } });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        user = await prisma.user.create({
            data: { name, email, passwordHash, role, phone: phone || null }
        });

        const payload = { user: { id: user.id, role: user.role } };
        const token = jsonwebtoken.sign(payload, JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/login', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

        // Generate OTP
        const otpCode = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

        await prisma.user.update({
            where: { email },
            data: { otpCode, otpExpiry }
        });

        // Send OTP via SMS if phone exists, otherwise fallback to console
        if (user.phone) {
            await sendOTP(user.phone, otpCode);
        } else {
            console.log(`\n========================================`);
            console.log(`  📱 SMS OTP (No phone on file)`);
            console.log(`  User: ${user.email}`);
            console.log(`  OTP: ${otpCode}`);
            console.log(`  ⚠️  Add phone number to user profile`);
            console.log(`========================================\n`);
        }

        // Mask phone number for display
        const maskedPhone = user.phone
            ? user.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2')
            : null;

        res.json({
            message: user.phone
                ? `OTP sent to ${maskedPhone}`
                : 'OTP sent (check server console — no phone number on file)',
            requireOtp: true,
            email: user.email,
            maskedPhone
        });
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

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/forgot-password', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, phone } = req.body;

        // Find user by email or phone
        let user;
        if (email) {
            user = await prisma.user.findUnique({ where: { email } });
        } else if (phone) {
            const cleanPhone = phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');
            user = await prisma.user.findFirst({ where: { phone: { contains: cleanPhone } } });
        }

        if (!user) return res.status(404).json({ message: 'User not found' });

        const otpCode = generateOTP();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await prisma.user.update({
            where: { id: user.id },
            data: { otpCode, otpExpiry }
        });

        // Send OTP via SMS
        if (user.phone) {
            await sendOTP(user.phone, otpCode);
        } else {
            console.log(`\n========================================`);
            console.log(`  📱 Password Reset OTP (No phone)`);
            console.log(`  User: ${user.email}`);
            console.log(`  OTP: ${otpCode}`);
            console.log(`========================================\n`);
        }

        const maskedPhone = user.phone
            ? user.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2')
            : null;

        res.json({
            message: user.phone
                ? `OTP sent to ${maskedPhone}`
                : 'OTP sent (check server console)',
            email: user.email,
            maskedPhone
        });
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/reset-password', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, otpCode, newPassword } = req.body;
        if (!email || !otpCode || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP code, and new password are required' });
        }
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
