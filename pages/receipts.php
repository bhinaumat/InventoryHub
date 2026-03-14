<?php
require_once __DIR__ . '/../includes/config.php';
requireLogin();

// ── Handle actions ─────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    // Create receipt
    if ($action === 'create') {
        $supplier = trim($_POST['supplier']);
        $date     = $_POST['receipt_date'];
        $notes    = trim($_POST['notes'] ?? '');
        $ref      = genRef($conn, 'REC', 'receipts');

        $stmt = $conn->prepare("INSERT INTO receipts (ref_code, supplier, receipt_date, status, notes) VALUES (?,?,?,'draft',?)");
        $stmt->bind_param('ssss', $ref, $supplier, $date, $notes);
        $stmt->execute();
        $recId = $conn->insert_id;

        $productIds = $_POST['product_id'] ?? [];
        $quantities = $_POST['qty']        ?? [];
        foreach ($productIds as $i => $pid) {
            if (!$pid || !($quantities[$i] ?? 0)) continue;
            $qty  = (float)$quantities[$i];
            $stmt = $conn->prepare("INSERT INTO receipt_items (receipt_id, product_id, qty) VALUES (?,?,?)");
            $stmt->bind_param('iid', $recId, $pid, $qty);
            $stmt->execute();
        }
        setFlash('success', "Receipt $ref created.");
    }

    // Validate receipt → increases stock
    if ($action === 'validate') {
        $id = (int)$_POST['id'];
        $rec = $conn->query("SELECT * FROM receipts WHERE id=$id")->fetch_assoc();
        if ($rec && $rec['status'] !== 'done') {
            $items = $conn->query("SELECT * FROM receipt_items WHERE receipt_id=$id")->fetch_all(MYSQLI_ASSOC);
            foreach ($items as $item) {
                $pid = $item['product_id'];
                $qty = $item['qty'];
                $conn->query("UPDATE products SET stock = stock + $qty WHERE id=$pid");
                $after = $conn->query("SELECT stock FROM products WHERE id=$pid")->fetch_assoc()['stock'];
                $stmt  = $conn->prepare("INSERT INTO stock_ledger (product_id, move_type, ref_code, qty_change, stock_after, note) VALUES (?,?,'receipt',?,?,?)");
                $type  = 'receipt';
                $note  = "Received from {$rec['supplier']}";
                $stmt->bind_param('isdds', $pid, $type, $qty, $after, $note);
                $stmt->execute();
            }
            $conn->query("UPDATE receipts SET status='done' WHERE id=$id");
            setFlash('success', "Receipt {$rec['ref_code']} validated — stock updated.");
        }
    }

    // Cancel
    if ($action === 'cancel') {
        $id = (int)$_POST['id'];
        $conn->query("UPDATE receipts SET status='cancelled' WHERE id=$id");
        setFlash('success', "Receipt cancelled.");
    }

    header('Location: receipts.php');
    exit;
}

// ── Fetch data ─────────────────────────────────────────────
$statusFilt = $_GET['status'] ?? '';
$where = $statusFilt ? "WHERE r.status = '" . $conn->real_escape_string($statusFilt) . "'" : '';

$receipts = $conn->query("
    SELECT r.*, COUNT(ri.id) AS item_count
    FROM receipts r
    LEFT JOIN receipt_items ri ON ri.receipt_id = r.id
    $where
    GROUP BY r.id ORDER BY r.created_at DESC
")->fetch_all(MYSQLI_ASSOC);

$products = $conn->query("SELECT id, name, sku, unit FROM products ORDER BY name")->fetch_all(MYSQLI_ASSOC);

include __DIR__ . '/../includes/header.php';
?>

<div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;gap:16px;">
  <div class="page-header-left"><div class="page-title"><span>R</span>eceipts</div><div class="page-subtitle">Incoming stock from suppliers — validate to update inventory</div></div>
  <button class="btn btn-primary" data-modal-open="receiptModal">
    <i data-feather="plus"></i> New Receipt
  </button>
</div>

<!-- Status filter -->
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
        <tr><th>Ref</th><th>Supplier</th><th>Date</th><th>Items</th><th>Status</th><th>Notes</th><th></th></tr>
      </thead>
      <tbody>
        <?php foreach ($receipts as $r): ?>
        <tr>
          <td class="td-mono"><?= e($r['ref_code']) ?></td>
          <td style="font-weight:600;"><?= e($r['supplier']) ?></td>
          <td><?= e($r['receipt_date']) ?></td>
          <td><?= $r['item_count'] ?> line(s)</td>
          <td><?= badge($r['status']) ?></td>
          <td style="color:var(--slate-400);font-size:12px;"><?= e($r['notes']) ?></td>
          <td>
            <div class="flex gap-8" style="justify-content:flex-end;">
              <?php if ($r['status'] !== 'done' && $r['status'] !== 'cancelled'): ?>
              <form method="POST" style="display:inline;">
                <input type="hidden" name="action" value="validate">
                <input type="hidden" name="id" value="<?= $r['id'] ?>">
                <button type="submit" class="btn btn-success"
                  data-confirm="Validate receipt <?= e($r['ref_code']) ?>? Stock will increase.">
                  <i data-feather="check-circle" style="width:13px;height:13px;"></i> Validate
                </button>
              </form>
              <form method="POST" style="display:inline;">
                <input type="hidden" name="action" value="cancel">
                <input type="hidden" name="id" value="<?= $r['id'] ?>">
                <button type="submit" class="btn btn-danger btn-sm"
                  data-confirm="Cancel receipt <?= e($r['ref_code']) ?>?">Cancel</button>
              </form>
              <?php endif; ?>
            </div>
          </td>
        </tr>
        <?php endforeach; ?>
        <?php if (empty($receipts)): ?>
          <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--slate-400);">No receipts found.</td></tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Create Receipt Modal -->
<div class="modal-overlay" id="receiptModal">
  <div class="modal" style="max-width:580px;">
    <div class="modal-header">
      <h2>New Receipt</h2>
      <button class="modal-close" data-modal-close><i data-feather="x"></i></button>
    </div>
    <form method="POST" action="receipts.php">
      <input type="hidden" name="action" value="create">
      <div class="modal-body">
        <div class="form-grid form-grid-2">
          <div class="form-group">
            <label>Supplier *</label>
            <input type="text" name="supplier" class="form-control" placeholder="e.g. SteelCo Ltd" required>
          </div>
          <div class="form-group">
            <label>Receipt Date *</label>
            <input type="date" name="receipt_date" class="form-control" value="<?= date('Y-m-d') ?>" required>
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label>Notes</label>
            <input type="text" name="notes" class="form-control" placeholder="Optional notes…">
          </div>
        </div>

        <hr class="divider">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <label style="font-weight:600;font-size:13px;">Product Lines</label>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addLine()">+ Add Line</button>
        </div>
        <div class="line-items" id="lineItems">
          <div class="line-item">
            <select name="product_id[]" class="form-control" required>
              <option value="">Select product…</option>
              <?php foreach ($products as $p): ?>
                <option value="<?= $p['id'] ?>"><?= e($p['name']) ?> (<?= e($p['sku']) ?>)</option>
              <?php endforeach; ?>
            </select>
            <input type="number" name="qty[]" class="form-control" placeholder="Qty" min="0.01" step="0.01" required>
            <button type="button" class="btn-icon" onclick="removeLine(this)" style="color:var(--red-500);">
              <i data-feather="x"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn-primary">Create Receipt</button>
      </div>
    </form>
  </div>
</div>

<?php
$productJson = json_encode($products);
$extraScript = <<<JS
<script>
const products = $productJson;
function productOptions() {
  return products.map(p => `<option value="\${p.id}">\${p.name} (\${p.sku})</option>`).join('');
}
function addLine() {
  const div = document.createElement('div');
  div.className = 'line-item';
  div.innerHTML = `
    <select name="product_id[]" class="form-control" required>
      <option value="">Select product…</option>\${productOptions()}
    </select>
    <input type="number" name="qty[]" class="form-control" placeholder="Qty" min="0.01" step="0.01" required>
    <button type="button" class="btn-icon" onclick="removeLine(this)" style="color:var(--red-500);">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>`;
  document.getElementById('lineItems').appendChild(div);
}
function removeLine(btn) {
  const items = document.querySelectorAll('#lineItems .line-item');
  if (items.length > 1) btn.closest('.line-item').remove();
}
</script>
JS;
include __DIR__ . '/../includes/footer.php';
?>
