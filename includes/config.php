<?php
// ── Database Configuration ────────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');           // XAMPP default: empty password
define('DB_NAME', 'inventoryhub');
define('APP_NAME', 'InventoryHub');

// ── Connect ───────────────────────────────────────────────────
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    die('<div style="font-family:sans-serif;padding:40px;color:#c00">
        <h2>Database Connection Failed</h2>
        <p>' . $conn->connect_error . '</p>
        <p>Make sure XAMPP is running and you imported <code>database.sql</code>.</p>
    </div>');
}
$conn->set_charset('utf8mb4');

// ── Session ───────────────────────────────────────────────────
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ── Auth helper ───────────────────────────────────────────────
function requireLogin() {
    if (empty($_SESSION['user_id'])) {
        header('Location: /inventoryhub/login.php');
        exit;
    }
}

// ── Generate reference codes ──────────────────────────────────
function genRef($conn, $prefix, $table, $col = 'ref_code') {
    $result = $conn->query("SELECT COUNT(*) AS cnt FROM `$table`");
    $row    = $result->fetch_assoc();
    $num    = str_pad($row['cnt'] + 1, 3, '0', STR_PAD_LEFT);
    return "$prefix-$num";
}

// ── Flash messages ────────────────────────────────────────────
function setFlash($type, $msg) {
    $_SESSION['flash'] = ['type' => $type, 'msg' => $msg];
}
function getFlash() {
    if (!empty($_SESSION['flash'])) {
        $f = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $f;
    }
    return null;
}

// ── Escape helper ─────────────────────────────────────────────
function e($s) { return htmlspecialchars($s ?? '', ENT_QUOTES, 'UTF-8'); }

// ── Badge HTML ────────────────────────────────────────────────
function badge($status) {
    $map = [
        'draft'     => 'badge-draft',
        'waiting'   => 'badge-waiting',
        'ready'     => 'badge-ready',
        'done'      => 'badge-done',
        'cancelled' => 'badge-cancelled',
    ];
    $cls = $map[$status] ?? 'badge-draft';
    return '<span class="badge ' . $cls . '">' . e($status) . '</span>';
}
