import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import warehouseRoutes from './routes/warehouseRoutes';
import locationRoutes from './routes/locationRoutes';
import operationRoutes from './routes/operationRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import clientRoutes from './routes/clientRoutes';
import stockRoutes from './routes/stockRoutes';
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
    res.send('IMS Backend API is running. Access API at /api/* endpoints.');
});

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'IMS Backend Server Running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/stock', stockRoutes);

const server = http.createServer(app);
server.listen(Number(port), '127.0.0.1', () => {
    console.log(`Server is running on http://127.0.0.1:${port}`);
});
