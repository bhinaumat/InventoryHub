-- ============================================================
--  InventoryHub — MySQL Database Schema
--  Import this in phpMyAdmin or run: mysql -u root < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS inventoryhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventoryhub;

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('manager','staff') DEFAULT 'staff',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── WAREHOUSES ───────────────────────────────────────────────
CREATE TABLE warehouses (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    location   VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── CATEGORIES ───────────────────────────────────────────────
CREATE TABLE categories (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- ── PRODUCTS ─────────────────────────────────────────────────
CREATE TABLE products (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    sku          VARCHAR(80)  NOT NULL UNIQUE,
    category_id  INT,
    unit         VARCHAR(30)  NOT NULL DEFAULT 'pcs',
    stock        DECIMAL(12,2) NOT NULL DEFAULT 0,
    min_stock    DECIMAL(12,2) NOT NULL DEFAULT 0,
    warehouse_id INT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id)  REFERENCES categories(id)  ON DELETE SET NULL,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)  ON DELETE SET NULL
);

-- ── RECEIPTS (Incoming) ──────────────────────────────────────
CREATE TABLE receipts (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    ref_code     VARCHAR(20) NOT NULL UNIQUE,
    supplier     VARCHAR(150) NOT NULL,
    receipt_date DATE NOT NULL,
    status       ENUM('draft','waiting','ready','done','cancelled') DEFAULT 'draft',
    notes        TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE receipt_items (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    receipt_id INT NOT NULL,
    product_id INT NOT NULL,
    qty        DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (receipt_id) REFERENCES receipts(id)  ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)  ON DELETE CASCADE
);

-- ── DELIVERIES (Outgoing) ────────────────────────────────────
CREATE TABLE deliveries (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    ref_code      VARCHAR(20) NOT NULL UNIQUE,
    customer      VARCHAR(150) NOT NULL,
    delivery_date DATE NOT NULL,
    status        ENUM('draft','waiting','ready','done','cancelled') DEFAULT 'draft',
    notes         TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE delivery_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    delivery_id INT NOT NULL,
    product_id  INT NOT NULL,
    qty         DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id)  REFERENCES products(id)   ON DELETE CASCADE
);

-- ── INTERNAL TRANSFERS ───────────────────────────────────────
CREATE TABLE transfers (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    ref_code        VARCHAR(20) NOT NULL UNIQUE,
    from_warehouse  VARCHAR(100) NOT NULL,
    to_warehouse    VARCHAR(100) NOT NULL,
    transfer_date   DATE NOT NULL,
    status          ENUM('draft','waiting','ready','done','cancelled') DEFAULT 'draft',
    notes           TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transfer_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    transfer_id INT NOT NULL,
    product_id  INT NOT NULL,
    qty         DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id)  REFERENCES products(id)  ON DELETE CASCADE
);

-- ── STOCK ADJUSTMENTS ────────────────────────────────────────
CREATE TABLE adjustments (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    ref_code   VARCHAR(20) NOT NULL UNIQUE,
    reason     VARCHAR(200) NOT NULL,
    adj_date   DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE adjustment_items (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    adjustment_id INT NOT NULL,
    product_id    INT NOT NULL,
    qty           DECIMAL(12,2) NOT NULL,  -- negative = reduction
    FOREIGN KEY (adjustment_id) REFERENCES adjustments(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id)    REFERENCES products(id)    ON DELETE CASCADE
);

-- ── STOCK LEDGER (Move History) ──────────────────────────────
CREATE TABLE stock_ledger (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    product_id   INT NOT NULL,
    move_type    ENUM('receipt','delivery','transfer','adjustment') NOT NULL,
    ref_code     VARCHAR(20) NOT NULL,
    qty_change   DECIMAL(12,2) NOT NULL,
    stock_after  DECIMAL(12,2) NOT NULL,
    note         VARCHAR(200),
    moved_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
--  SEED DATA
-- ============================================================

INSERT INTO users (name, email, password, role) VALUES
('Inventory Manager', 'manager@hub.io', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager'),
('Warehouse Staff',   'staff@hub.io',   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff');
-- Default password for both: "password"

INSERT INTO warehouses (name, location) VALUES
('Main Warehouse',   'Building A, Ground Floor'),
('Production Floor', 'Building B, Level 1'),
('Warehouse 2',      'Building C, Ground Floor');

INSERT INTO categories (name) VALUES
('Raw Materials'), ('Furniture'), ('Electrical'), ('Safety'), ('Packaging');

INSERT INTO products (name, sku, category_id, unit, stock, min_stock, warehouse_id) VALUES
('Steel Rods',    'STL-001', 1, 'kg',  77, 20, 1),
('Office Chair',  'FRN-002', 2, 'pcs', 45, 10, 1),
('Copper Wire',   'ELC-003', 3, 'm',    8, 50, 3),
('Safety Helmet', 'SAF-004', 4, 'pcs', 30, 15, 1),
('Wooden Plank',  'WOD-005', 1, 'pcs',  0, 25, 3);

INSERT INTO receipts (ref_code, supplier, receipt_date, status) VALUES
('REC-001', 'SteelCo Ltd',  '2025-01-10', 'done'),
('REC-002', 'FurniWorld',   '2025-01-12', 'waiting'),
('REC-003', 'ElectroParts', '2025-01-14', 'draft');

INSERT INTO receipt_items (receipt_id, product_id, qty) VALUES
(1, 1, 100), (2, 2, 20), (3, 3, 200);

INSERT INTO deliveries (ref_code, customer, delivery_date, status) VALUES
('DEL-001', 'Acme Corp',     '2025-01-11', 'done'),
('DEL-002', 'BuildRight Co', '2025-01-13', 'ready');

INSERT INTO delivery_items (delivery_id, product_id, qty) VALUES
(1, 2, 10), (2, 1, 20);

INSERT INTO transfers (ref_code, from_warehouse, to_warehouse, transfer_date, status) VALUES
('TRF-001', 'Main Warehouse', 'Production Floor', '2025-01-12', 'done'),
('TRF-002', 'Warehouse 2',    'Main Warehouse',   '2025-01-14', 'draft');

INSERT INTO transfer_items (transfer_id, product_id, qty) VALUES
(1, 1, 50), (2, 5, 10);

INSERT INTO adjustments (ref_code, reason, adj_date) VALUES
('ADJ-001', 'Damaged goods', '2025-01-13');

INSERT INTO adjustment_items (adjustment_id, product_id, qty) VALUES
(1, 1, -3);

INSERT INTO stock_ledger (product_id, move_type, ref_code, qty_change, stock_after, note) VALUES
(1, 'receipt',    'REC-001', 100, 100, 'Initial receipt from SteelCo'),
(2, 'receipt',    'REC-001', 20,  20,  'Office chairs received'),
(2, 'delivery',   'DEL-001', -10, 10,  'Delivered to Acme Corp'),
(1, 'transfer',   'TRF-001', 0,   100, 'Moved to Production Floor'),
(1, 'adjustment', 'ADJ-001', -3,  77,  'Damaged goods written off');
