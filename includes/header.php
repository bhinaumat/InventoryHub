<?php
$flash       = getFlash();
$currentPage = basename($_SERVER['PHP_SELF'], '.php');

$nav = [
    ['file'=>'dashboard',   'label'=>'Dashboard',   'icon'=>'grid'],
    ['file'=>'products',    'label'=>'Products',     'icon'=>'box'],
    ['file'=>'receipts',    'label'=>'Receipts',     'icon'=>'arrow-down-circle'],
    ['file'=>'deliveries',  'label'=>'Deliveries',   'icon'=>'arrow-up-circle'],
    ['file'=>'transfers',   'label'=>'Transfers',    'icon'=>'repeat'],
    ['file'=>'adjustments', 'label'=>'Adjustments',  'icon'=>'sliders'],
    ['file'=>'history',     'label'=>'Move History', 'icon'=>'clock'],
];

$now = date('D, d M Y');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= APP_NAME ?> — <?= ucfirst($currentPage) ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/inventoryhub/assets/css/style.css">
<script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>

<!-- Scanlines -->
<div class="scanlines"></div>

<!-- Floating particles background -->
<canvas id="bgParticles" style="position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.4;"></canvas>

<div class="app-shell">

  <!-- ── SIDEBAR ──────────────────────────────────────── -->
  <aside class="sidebar">

    <!-- Logo -->
    <div class="sidebar-logo">
      <div class="logo-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/>
          <rect x="15" y="14" width="7" height="7"/><rect x="2" y="14" width="7" height="7"/>
        </svg>
      </div>
      <div>
        <div class="logo-text"><?= APP_NAME ?></div>
        <div class="logo-sub">Control System</div>
      </div>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <div class="nav-section-label">Navigation</div>
      <?php foreach ($nav as $item): ?>
        <a href="/inventoryhub/pages/<?= $item['file'] ?>.php"
           class="nav-item <?= $currentPage === $item['file'] ? 'active' : '' ?>">
          <i data-feather="<?= $item['icon'] ?>"></i>
          <span><?= $item['label'] ?></span>
          <?php if ($currentPage === $item['file']): ?>
            <svg style="margin-left:auto;color:var(--neon-cyan);opacity:0.5;" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          <?php endif; ?>
        </a>
      <?php endforeach; ?>
    </nav>

    <!-- System status -->
    <div style="padding:10px 12px;margin:0 8px;border:1px solid var(--border-subtle);border-radius:10px;background:rgba(0,212,255,0.02);margin-bottom:10px;">
      <div style="font-family:'Orbitron',monospace;font-size:8px;letter-spacing:2px;color:var(--text-muted);margin-bottom:8px;">SYSTEM STATUS</div>
      <?php
      $totalProd = $conn->query("SELECT COUNT(*) AS c FROM products")->fetch_assoc()['c'];
      $lowStock  = $conn->query("SELECT COUNT(*) AS c FROM products WHERE stock > 0 AND stock < min_stock")->fetch_assoc()['c'];
      $pending   = $conn->query("SELECT COUNT(*) AS c FROM receipts WHERE status NOT IN ('done','cancelled')")->fetch_assoc()['c'];
      ?>
      <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
        <span style="font-size:11px;color:var(--text-muted);">Products</span>
        <span style="font-family:'Orbitron',monospace;font-size:11px;color:var(--neon-cyan);"><?= $totalProd ?></span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
        <span style="font-size:11px;color:var(--text-muted);">Low Stock</span>
        <span style="font-family:'Orbitron',monospace;font-size:11px;color:var(--neon-amber);"><?= $lowStock ?></span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="font-size:11px;color:var(--text-muted);">Pending</span>
        <span style="font-family:'Orbitron',monospace;font-size:11px;color:var(--neon-green);"><?= $pending ?></span>
      </div>
    </div>

    <!-- User -->
    <div class="sidebar-user">
      <div class="user-avatar"><?= strtoupper(substr($_SESSION['user_name'] ?? 'U', 0, 2)) ?></div>
      <div class="user-info">
        <div class="user-name"><?= e($_SESSION['user_name'] ?? '') ?></div>
        <div class="user-role"><?= e($_SESSION['user_role'] ?? '') ?></div>
      </div>
      <a href="/inventoryhub/logout.php" class="logout-btn" title="Logout">
        <i data-feather="log-out" style="width:15px;height:15px;"></i>
      </a>
    </div>
  </aside>

  <!-- ── MAIN CONTENT ──────────────────────────────── -->
  <main class="main-content">

    <!-- Topbar -->
    <div class="topbar">
      <div>
        <div class="page-title">
          <span><?= strtoupper(substr($currentPage,0,1)) ?></span><?= strtolower(substr($currentPage,1)) ?>
        </div>
        <div class="page-subtitle"><?= $now ?> ▸ <?= APP_NAME ?> Control System</div>
      </div>
      <div class="topbar-right">
        <div class="topbar-badge" id="liveClock">--:--:--</div>
        <div class="topbar-badge" style="color:var(--neon-green);border-color:rgba(0,255,136,0.3);">
          <span style="display:inline-block;width:6px;height:6px;background:var(--neon-green);border-radius:50%;margin-right:6px;box-shadow:0 0 6px var(--neon-green);animation:statusPulse 2s infinite;"></span>
          ONLINE
        </div>
      </div>
    </div>

    <?php if ($flash): ?>
      <div class="flash flash-<?= $flash['type'] ?>">
        <i data-feather="<?= $flash['type']==='success' ? 'check-circle' : 'alert-circle' ?>" style="flex-shrink:0;"></i>
        <?= e($flash['msg']) ?>
      </div>
    <?php endif; ?>
