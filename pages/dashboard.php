<?php
require_once __DIR__ . '/../includes/config.php';
requireLogin();

// ── KPI Queries ────────────────────────────────────────────
$totalProducts = $conn->query("SELECT COUNT(*) AS c FROM products")->fetch_assoc()['c'];
$lowStock      = $conn->query("SELECT COUNT(*) AS c FROM products WHERE stock > 0 AND stock < min_stock")->fetch_assoc()['c'];
$outOfStock    = $conn->query("SELECT COUNT(*) AS c FROM products WHERE stock = 0")->fetch_assoc()['c'];
$pendingRec    = $conn->query("SELECT COUNT(*) AS c FROM receipts   WHERE status NOT IN ('done','cancelled')")->fetch_assoc()['c'];
$pendingDel    = $conn->query("SELECT COUNT(*) AS c FROM deliveries WHERE status NOT IN ('done','cancelled')")->fetch_assoc()['c'];
$pendingTrf    = $conn->query("SELECT COUNT(*) AS c FROM transfers  WHERE status NOT IN ('done','cancelled')")->fetch_assoc()['c'];

// ── Alert Products ─────────────────────────────────────────
$alertProducts = $conn->query("
    SELECT name, stock, unit, min_stock FROM products
    WHERE stock <= min_stock ORDER BY stock ASC LIMIT 10
")->fetch_all(MYSQLI_ASSOC);

// ── Recent Activity (union) ────────────────────────────────
$recentActivity = $conn->query("
    (SELECT ref_code, supplier AS party, receipt_date AS doc_date, status, 'Receipt' AS type FROM receipts)
    UNION ALL
    (SELECT ref_code, customer, delivery_date, status, 'Delivery' FROM deliveries)
    UNION ALL
    (SELECT ref_code, CONCAT(from_warehouse,' → ',to_warehouse), transfer_date, status, 'Transfer' FROM transfers)
    ORDER BY doc_date DESC LIMIT 10
")->fetch_all(MYSQLI_ASSOC);

// ── Stock chart data ───────────────────────────────────────
$chartProducts = $conn->query("
    SELECT name, stock, min_stock FROM products ORDER BY stock DESC LIMIT 7
")->fetch_all(MYSQLI_ASSOC);

// ── Scheduled Transfers ────────────────────────────────────
$transfers = $conn->query("
    SELECT * FROM transfers ORDER BY created_at DESC LIMIT 6
")->fetch_all(MYSQLI_ASSOC);

include __DIR__ . '/../includes/header.php';

// Chart JSON
$chartLabels = json_encode(array_column($chartProducts, 'name'));
$chartStock  = json_encode(array_column($chartProducts, 'stock'));
$chartMin    = json_encode(array_column($chartProducts, 'min_stock'));
?>

<div class="page-header">
  <div class="page-header-left">
    <h1>Dashboard</h1>
    <p>Real-time snapshot of your inventory operations</p>
  </div>
</div>

<!-- Alert Banner -->
<?php if (!empty($alertProducts)): ?>
<div class="alert-banner">
  <i data-feather="alert-triangle" style="width:18px;height:18px;"></i>
  <div>
    <h4>Stock Alerts — <?= count($alertProducts) ?> product(s) need attention</h4>
    <p><?= $outOfStock ?> out of stock · <?= $lowStock ?> below minimum threshold</p>
    <div class="alert-tags">
      <?php foreach ($alertProducts as $p): ?>
        <span class="alert-tag"><?= e($p['name']) ?> (<?= $p['stock']+0 ?> <?= e($p['unit']) ?>)</span>
      <?php endforeach; ?>
    </div>
  </div>
</div>
<?php endif; ?>

<!-- KPIs -->
<div class="kpi-grid">
  <div class="kpi-card cyan">
    <div class="corner-tl"></div><div class="corner-br"></div>
    <div class="kpi-icon"><i data-feather="box" style="width:20px;height:20px;"></i></div>
    <div>
      <div class="kpi-label">Total Products</div>
      <div class="kpi-value"><?= $totalProducts ?></div>
      <div class="kpi-sub">across all warehouses</div>
    </div>
  </div>
  <div class="kpi-card amber">
    <div class="corner-tl"></div><div class="corner-br"></div>
    <div class="kpi-icon"><i data-feather="alert-triangle" style="width:20px;height:20px;"></i></div>
    <div>
      <div class="kpi-label">Low / Out of Stock</div>
      <div class="kpi-value"><?= $lowStock ?> / <?= $outOfStock ?></div>
      <div class="kpi-sub">requires attention</div>
    </div>
  </div>
  <div class="kpi-card green">
    <div class="corner-tl"></div><div class="corner-br"></div>
    <div class="kpi-icon"><i data-feather="arrow-down-circle" style="width:20px;height:20px;"></i></div>
    <div>
      <div class="kpi-label">Pending Receipts</div>
      <div class="kpi-value"><?= $pendingRec ?></div>
      <div class="kpi-sub">awaiting validation</div>
    </div>
  </div>
  <div class="kpi-card violet">
    <div class="corner-tl"></div><div class="corner-br"></div>
    <div class="kpi-icon"><i data-feather="arrow-up-circle" style="width:20px;height:20px;"></i></div>
    <div>
      <div class="kpi-label">Pending Deliveries</div>
      <div class="kpi-value"><?= $pendingDel ?></div>
      <div class="kpi-sub">awaiting dispatch</div>
    </div>
  </div>
  <div class="kpi-card red">
    <div class="corner-tl"></div><div class="corner-br"></div>
    <div class="kpi-icon"><i data-feather="repeat" style="width:20px;height:20px;"></i></div>
    <div>
      <div class="kpi-label">Transfers Scheduled</div>
      <div class="kpi-value"><?= $pendingTrf ?></div>
      <div class="kpi-sub">in progress</div>
    </div>
  </div>
</div>

<!-- Chart + Activity -->
<div class="dash-grid">
  <!-- Bar Chart -->
  <div class="glass-panel"><div class="panel-header"><div class="panel-title">▸ Stock Levels</div></div>
    <div class="panel-body">
      <canvas id="stockChart" height="220"></canvas>
    </div>
  </div>

  <!-- Recent Activity -->
  <div class="glass-panel"><div class="panel-header"><div class="panel-title">▸ Recent Activity</div></div>
    <div class="panel-body">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ref</th><th>Party</th><th>Type</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($recentActivity as $a): ?>
            <tr>
              <td class="td-mono"><?= e($a['ref_code']) ?></td>
              <td><?= e($a['party']) ?></td>
              <td style="font-size:12px;color:var(--slate-500);"><?= e($a['type']) ?></td>
              <td><?= badge($a['status']) ?></td>
            </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- Transfers -->
<div class="glass-panel mt-16">
  <div class="panel-body">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <div class="card-title" style="margin:0;">Internal Transfers</div>
      <a href="/inventoryhub/pages/transfers.php" class="btn btn-secondary btn-sm">View All</a>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Ref</th><th>From</th><th>To</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          <?php foreach ($transfers as $t): ?>
          <tr>
            <td class="td-mono"><?= e($t['ref_code']) ?></td>
            <td><?= e($t['from_warehouse']) ?></td>
            <td><?= e($t['to_warehouse']) ?></td>
            <td><?= e($t['transfer_date']) ?></td>
            <td><?= badge($t['status']) ?></td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<?php
$extraScript = <<<JS
<script>
const ctx = document.getElementById('stockChart').getContext('2d');
const labels = $chartLabels;
const stocks  = $chartStock;
const mins    = $chartMin;
new Chart(ctx, {
  type: 'bar',
  data: {
    labels,
    datasets: [{
      label: 'Current Stock',
      data: stocks,
      backgroundColor: stocks.map((v,i) => v <= mins[i]
        ? 'rgba(255,170,0,0.7)'
        : 'rgba(0,212,255,0.6)'),
      borderColor: stocks.map((v,i) => v <= mins[i] ? '#ffaa00' : '#00d4ff'),
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(6,13,24,0.95)',
        borderColor: 'rgba(0,212,255,0.3)',
        borderWidth: 1,
        titleColor: '#00d4ff',
        bodyColor: '#8ab4d4',
        titleFont: { family: 'Orbitron', size: 10 },
        callbacks: { label: ctx => ' ' + ctx.parsed.y + ' units' }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,212,255,0.05)' },
        ticks: { font: { size: 11, family: 'Orbitron' }, color: '#3a6080' }
      },
      y: {
        grid: { color: 'rgba(0,212,255,0.05)' },
        ticks: { font: { size: 11 }, color: '#3a6080' }
      }
    }
  }
});
</script>
JS;
include __DIR__ . '/../includes/footer.php';
?>
