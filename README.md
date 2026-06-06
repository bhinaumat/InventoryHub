# InventoryHub - Premium Inventory Management System

InventoryHub is a centralized, premium inventory management system that helps businesses track and manage stock efficiently. It allows users to manage products, monitor stock levels, and record activities like receipts, deliveries, transfers, and adjustments, improving accuracy and providing better control over inventory operations.

## Tech Stack
- **Frontend**: Next.js (App Router), TailwindCSS v4, Lucide-React
- **Backend**: Node.js, Express, Prisma, JWT stateless auth
- **Database**: SQLite (via Prisma)

## Prerequisites
- Node.js (v18+)

## Setup & Running Locally

1. **Backend Initialization**:
   ```bash
   cd backend
   npm install
   
   # Run migrations and generate client
   npx prisma db push
   
   # Optional: Seed the database with a test user and dummy data
   npx ts-node src/seed.ts
   
   # Start the development server
   npm run dev
   ```
   *The backend will run on `http://localhost:5000`.*

2. **Frontend Initialization**:
   ```bash
   cd frontend
   npm install
   
   # Start the frontend server
   npm run dev
   ```
   *The frontend will run on `http://localhost:3000`.*

## Login Credentials
If you seeded the database:
- **Email**: `admin@nexims.com`
- **Password**: `password123`

Features include multi-warehouse transfers, receipt limits, stock ledger logs, role-based auth, dynamic dashboards, and a premium aesthetic.
