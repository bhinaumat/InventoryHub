<?php
require_once __DIR__ . '/../includes/config.php';
requireLogin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'create') {
        $customer = trim($_POST['customer']);
        $date     = $_POST['delivery_date'];
        $notes    = trim($_POST['notes'] ?? '');
        $ref      = genRef($conn, 'DEL', 'deliveries');

        $stmt = $conn->prepare("INSERT INTO deliveries (ref_code, customer, delivery_date, status, notes) VALUES (?,?,?,'draft',?)");
        $stmt->bind_param('ssss', $ref, $customer, $date, $notes);
        $stmt->execute();
        $delId = $conn->insert_id;

        foreach ($_POST['product_id'] ?? [] as $i => $pid) {
            if (!$pid) continue;
            $qty  = (float)($_POST['qty'][$i] ?? 0);
            $stmt = $conn->prepare("INSERT INTO delivery_items (delivery_id, product_id, qty) VALUES (?,?,?)");
            $stmt->bind_param('iid', $delId, $pid, $qty);
            $stmt->execute();
        }
        setFlash('success', "Delivery $ref created.");
    }

    if ($action === 'validate') {
        $id  = (int)$_POST['id'];
        $del = $conn->query("SELECT * FROM deliveries WHERE id=$id")->fetch_assoc();
        if ($del && $del['status'] !== 'done') {
            $items = $conn->query("SELECT * FROM delivery_items WHERE delivery_id=$id")->fetch_all(MYSQLI_ASSOC);
            foreach ($items as $item) {
                $pid = $item['product_id'];
                $qty = $item['qty'];
                $conn->query("UPDATE products SET stock = GREATEST(0, stock - $qty) WHERE id=$pid");
                $after = $conn->query("SELECT stock FROM products WHERE id=$pid")->fetch_assoc()['stock'];
                $change = -$qty;
                $note   = "Delivered to {$del['customer']}";
                $type   = 'delivery';
                $stmt   = $conn->prepare("INSERT INTO stock_ledger (product_id, move_type, ref_code, qty_change, stock_after, note) VALUES (?,?,?,?,?,?)");
                $ref    = $del['ref_code'];
                $stmt->bind_param('issdds', $pid, $type, $ref, $change, $after, $note);
                $stmt->execute();
            }
            $conn->query("UPDATE deliveries SET status='done' WHERE id=$id");
            setFlash('success', "Delivery {$del['ref_code']} validated — stock decreased.");
        }
    }

    if ($action === 'cancel') {
        $id = (int)$_POST['id'];
        $conn->query("UPDATE deliveries SET status='cancelled' WHERE id=$id");
        setFlash('success', "Delivery cancelled.");
    }

    header('Location: deliveries.php');
    exit;
}

$statusFilt = $_GET['status'] ?? '';
$where = $statusFilt ? "WHERE d.status = '" . $conn->real_escape_string($statusFilt) . "'" : '';

$deliveries = $conn->query("
    SELECT d.*, COUNT(di.id) AS item_count
    FROM deliveries d
    LEFT JOIN delivery_items di ON di.delivery_id = d.id
    $where
    GROUP BY d.id ORDER BY d.created_at DESC
")->fetch_all(MYSQLI_ASSOC);

$products = $conn->query("SELECT id, name, sku, unit, stock FROM products ORDER BY name")->fetch_all(MYSQLI_ASSOC);

include __DIR__ . '/../includes/header.php';
?>

<div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;gap:16px;">
  <div class="page-header-left"><div class="page-title"><span>D</span>elivery Orders</div><div class="page-subtitle">Outgoing stock to customers — validate to reduce inventory</div></div>
  <button class="btn btn-primary" data-modal-open="deliveryModal">
    <i data-feather="plus"></i> New Delivery
  </button>
</div>

<div class="filters-bar">
  <?php foreach (['', 'draft', 'waiting', 'ready', 'done', 'cancelled'] as $s): ?>
    <a href="?status=<?= $s ?>" class="btn btn-sm <?= ($statusFilt === $s) ? 'btn-primary' : 'btn-secondary' ?>">
      <?= $s === '' ? 'All' : ucfirst($s) ?>
    </a>
  <?php endforeach; ?>
</div>

<div class="glass-panel">
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Ref</th><th>Customer</th><th>Date</th><th>Items</th><th>Status</th><th>Notes</th><th></th></tr>
      </thead>
      <tbody>
        <?php foreach ($deliveries as $d): ?>
        <tr>
          <td class="td-mono"><?= e($d['ref_code']) ?></td>
          <td style="font-weight:600;"><?= e($d['customer']) ?></td>
          <td><?= e($d['delivery_date']) ?></td>
          <td><?= $d['item_count'] ?> line(s)</td>
          <td><?= badge($d['status']) ?></td>
          <td style="color:var(--slate-400);font-size:12px;"><?= e($d['notes']) ?></td>
          <td>
            <div class="flex gap-8" style="justify-content:flex-end;">
              <?php if ($d['status'] !== 'done' && $d['status'] !== 'cancelled'): ?>
              <form method="POST" style="display:inline;">
                <input type="hidden" name="action" value="validate">
                <input type="hidden" name="id" value="<?= $d['id'] ?>">
                <button type="submit" class="btn btn-success"
                  data-confirm="Validate delivery <?= e($d['ref_code']) ?>? Stock will decrease.">
                  <i data-feather="check-circle" style="width:13px;height:13px;"></i> Validate
                </button>
              </form>
              <form method="POST" style="display:inline;">
                <input type="hidden" name="action" value="cancel">
                <input type="hidden" name="id" value="<?= $d['id'] ?>">
                <button type="submit" class="btn btn-danger btn-sm"
                  data-confirm="Cancel delivery <?= e($d['ref_code']) ?>?">Cancel</button>
              </form>
              <?php endif; ?>
            </div>
          </td>
        </tr>
        <?php endforeach; ?>
        <?php if (empty($deliveries)): ?>
          <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--slate-400);">No deliveries found.</td></tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Modal -->
<div class="modal-overlay" id="deliveryModal">
  <div class="modal" style="max-width:580px;">
    <div class="modal-header">
      <h2>New Delivery Order</h2>
      <button class="modal-close" data-modal-close><i data-feather="x"></i></button>
    </div>
    <form method="POST" action="deliveries.php">
      <input type="hidden" name="action" value="create">
      <div class="modal-body">
        <div class="form-grid form-grid-2">
          <div class="form-group">
            <label>Customer *</label>
            <input type="text" name="customer" class="form-control" placeholder="e.g. Acme Corp" required>
          </div>
          <div class="form-group">
            <label>Delivery Date *</label>
            <input type="date" name="delivery_date" class="form-control" value="<?= date('Y-m-d') ?>" required>
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label>Notes</label>
            <input type="text" name="notes" class="form-control" placeholder="Optional notes…">
          </div>
        </div>
        <hr class="divider">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <label style="font-weight:600;font-size:13px;">Product Lines</label>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addDelLine()">+ Add Line</button>
        </div>
        <div class="line-items" id="delLineItems">
          <div class="line-item">
            <select name="product_id[]" class="form-control" required>
              <option value="">Select product…</option>
              <?php foreach ($products as $p): ?>
                <option value="<?= $p['id'] ?>"><?= e($p['name']) ?> — <?= $p['stock']+0 ?> <?= e($p['unit']) ?> avail.</option>
              <?php endforeach; ?>
            </select>
            <input type="number" name="qty[]" class="form-control" placeholder="Qty" min="0.01" step="0.01" required>
            <button type="button" class="btn-icon" onclick="removeDelLine(this)" style="color:var(--red-500);">
              <i data-feather="x"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn-primary">Create Delivery</button>
      </div>
    </form>
  </div>
</div>

<?php
$productJson = json_encode($products);
$extraScript = <<<JS
<script>
const delProducts = $productJson;
function delOptions() {
  return delProducts.map(p => `<option value="\${p.id}">\${p.name} — \${p.stock} \${p.unit} avail.</option>`).join('');
}
function addDelLine() {
  const div = document.createElement('div');
  div.className = 'line-item';
  div.innerHTML = `
    <select name="product_id[]" class="form-control" required>
      <option value="">Select product…</option>\${delOptions()}
    </select>
    <input type="number" name="qty[]" class="form-control" placeholder="Qty" min="0.01" step="0.01" required>
    <button type="button" class="btn-icon" onclick="removeDelLine(this)" style="color:var(--red-500);">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>`;
  document.getElementById('delLineItems').appendChild(div);
}
function removeDelLine(btn) {
  const items = document.querySelectorAll('#delLineItems .line-item');
  if (items.length > 1) btn.closest('.line-item').remove();
}
</script>
JS;
include __DIR__ . '/../includes/footer.php';
?>
