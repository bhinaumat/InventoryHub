<?php
require_once __DIR__ . '/../includes/config.php';
requireLogin();

// ── Filters ────────────────────────────────────────────────
$typeFilt    = $_GET['type']       ?? '';
$productFilt = (int)($_GET['product'] ?? 0);
$dateFrom    = $_GET['date_from']  ?? '';
$dateTo      = $_GET['date_to']    ?? '';

$where  = ["1=1"];
$params = []; $types = '';

if ($typeFilt)    { $where[] = "sl.move_type = ?"; $params[] = &$typeFilt;    $types .= 's'; }
if ($productFilt) { $where[] = "sl.product_id = ?"; $params[] = &$productFilt; $types .= 'i'; }
if ($dateFrom)    { $where[] = "DATE(sl.moved_at) >= ?"; $params[] = &$dateFrom; $types .= 's'; }
if ($dateTo)      { $where[] = "DATE(sl.moved_at) <= ?"; $params[] = &$dateTo;   $types .= 's'; }

$sql = "SELECT sl.*, p.name AS product_name, p.unit
        FROM stock_ledger sl
        LEFT JOIN products p ON p.id = sl.product_id
        WHERE " . implode(' AND ', $where) . "
        ORDER BY sl.moved_at DESC LIMIT 200";

$stmt = $conn->prepare($sql);
if ($types) {
    array_unshift($params, $types);
    call_user_func_array([$stmt, 'bind_param'], $params);
}
$stmt->execute();
$ledger = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

$products = $conn->query("SELECT id, name FROM products ORDER BY name")->fetch_all(MYSQLI_ASSOC);

include __DIR__ . '/../includes/header.php';

$typeBadge = [
    'receipt'    => ['color'=>'var(--green-100)', 'text'=>'var(--green-700)', 'label'=>'Receipt'],
    'delivery'   => ['color'=>'#fce7f3',          'text'=>'#9d174d',          'label'=>'Delivery'],
    'transfer'   => ['color'=>'var(--blue-100)',  'text'=>'var(--blue-700)',  'label'=>'Transfer'],
    'adjustment' => ['color'=>'var(--amber-100)', 'text'=>'var(--amber-700)','label'=>'Adjustment'],
];
?>

<div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;gap:16px;">
  <div class="page-header-left"><div class="page-title"><span>M</span>ove History</div><div class="page-subtitle">Complete stock ledger — every movement recorded here</div></div>
</div>

<!-- Filters -->
<form method="GET" action="history.php">
  <div class="filters-bar">
    <select name="type" class="form-control" style="width:150px;">
      <option value="">All Types</option>
      <option value="receipt"    <?= $typeFilt==='receipt'    ? 'selected':'' ?>>Receipt</option>
      <option value="delivery"   <?= $typeFilt==='delivery'   ? 'selected':'' ?>>Delivery</option>
      <option value="transfer"   <?= $typeFilt==='transfer'   ? 'selected':'' ?>>Transfer</option>
      <option value="adjustment" <?= $typeFilt==='adjustment' ? 'selected':'' ?>>Adjustment</option>
    </select>
    <select name="product" class="form-control" style="width:200px;">
      <option value="">All Products</option>
      <?php foreach ($products as $p): ?>
        <option value="<?= $p['id'] ?>" <?= $productFilt==$p['id'] ? 'selected':'' ?>><?= e($p['name']) ?></option>
      <?php endforeach; ?>
    </select>
    <input type="date" name="date_from" class="form-control" value="<?= e($dateFrom) ?>" style="width:150px;" placeholder="From">
    <input type="date" name="date_to"   class="form-control" value="<?= e($dateTo) ?>"   style="width:150px;" placeholder="To">
    <button type="submit" class="btn btn-primary btn-sm">Filter</button>
    <a href="history.php" class="btn btn-secondary btn-sm">Reset</a>
  </div>
</form>

<div class="glass-panel">
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Date & Time</th>
          <th>Type</th>
          <th>Reference</th>
          <th>Product</th>
          <th style="text-align:right;">Qty Change</th>
          <th style="text-align:right;">Stock After</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($ledger as $row):
          $tb    = $typeBadge[$row['move_type']] ?? ['color'=>'#f1f5f9','text'=>'#64748b','label'=>$row['move_type']];
          $qSign = $row['qty_change'] > 0 ? '+' : ($row['qty_change'] < 0 ? '' : '±');
          $qColor = $row['qty_change'] > 0 ? 'var(--green-600)' : ($row['qty_change'] < 0 ? 'var(--red-500)' : 'var(--slate-400)');
        ?>
        <tr>
          <td style="white-space:nowrap;font-size:12px;color:var(--slate-500);">
            <?= date('d M Y', strtotime($row['moved_at'])) ?><br>
            <span style="color:var(--slate-400);"><?= date('H:i', strtotime($row['moved_at'])) ?></span>
          </td>
          <td>
            <span style="background:<?= $tb['color'] ?>;color:<?= $tb['text'] ?>;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:600;">
              <?= $tb['label'] ?>
            </span>
          </td>
          <td class="td-mono"><?= e($row['ref_code']) ?></td>
          <td style="font-weight:500;"><?= e($row['product_name']) ?></td>
          <td style="text-align:right;font-weight:700;color:<?= $qColor ?>;">
            <?= $qSign . ($row['qty_change']+0) ?> <?= e($row['unit']) ?>
          </td>
          <td style="text-align:right;color:var(--slate-600);font-weight:600;">
            <?= ($row['stock_after']+0) ?> <?= e($row['unit']) ?>
          </td>
          <td style="font-size:12px;color:var(--slate-400);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            <?= e($row['note']) ?>
          </td>
        </tr>
        <?php endforeach; ?>
        <?php if (empty($ledger)): ?>
          <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--slate-400);">No movements found.</td></tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
