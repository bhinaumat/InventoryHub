<?php
require_once __DIR__ . '/../includes/config.php';
requireLogin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'create') {
        $from  = trim($_POST['from_warehouse']);
        $to    = trim($_POST['to_warehouse']);
        $date  = $_POST['transfer_date'];
        $notes = trim($_POST['notes'] ?? '');
        $ref   = genRef($conn, 'TRF', 'transfers');

        $stmt = $conn->prepare("INSERT INTO transfers (ref_code, from_warehouse, to_warehouse, transfer_date, status, notes) VALUES (?,?,?,?,'draft',?)");
        $stmt->bind_param('sssss', $ref, $from, $to, $date, $notes);
        $stmt->execute();
        $trfId = $conn->insert_id;

        foreach ($_POST['product_id'] ?? [] as $i => $pid) {
            if (!$pid) continue;
            $qty  = (float)($_POST['qty'][$i] ?? 0);
            $stmt = $conn->prepare("INSERT INTO transfer_items (transfer_id, product_id, qty) VALUES (?,?,?)");
            $stmt->bind_param('iid', $trfId, $pid, $qty);
            $stmt->execute();
        }
        setFlash('success', "Transfer $ref created.");
    }

    if ($action === 'validate') {
        $id  = (int)$_POST['id'];
        $trf = $conn->query("SELECT * FROM transfers WHERE id=$id")->fetch_assoc();
        if ($trf && $trf['status'] !== 'done') {
            $items = $conn->query("SELECT * FROM transfer_items WHERE transfer_id=$id")->fetch_all(MYSQLI_ASSOC);
            foreach ($items as $item) {
                $pid  = $item['product_id'];
                $note = "Transfer {$trf['ref_code']}: {$trf['from_warehouse']} → {$trf['to_warehouse']}";
                $type = 'transfer';
                $ref  = $trf['ref_code'];
                $after = (float)$conn->query("SELECT stock FROM products WHERE id=$pid")->fetch_assoc()['stock'];
                $stmt  = $conn->prepare("INSERT INTO stock_ledger (product_id, move_type, ref_code, qty_change, stock_after, note) VALUES (?,?,?,0,?,?)");
                $stmt->bind_param('isdds', $pid, $type, $ref, $after, $note);
                $stmt->execute();
            }
            $conn->query("UPDATE transfers SET status='done' WHERE id=$id");
            setFlash('success', "Transfer {$trf['ref_code']} validated. Location updated in ledger.");
        }
    }

    if ($action === 'cancel') {
        $id = (int)$_POST['id'];
        $conn->query("UPDATE transfers SET status='cancelled' WHERE id=$id");
        setFlash('success', "Transfer cancelled.");
    }

    header('Location: transfers.php');
    exit;
}

$statusFilt = $_GET['status'] ?? '';
$where = $statusFilt ? "WHERE t.status = '" . $conn->real_escape_string($statusFilt) . "'" : '';

$transfers = $conn->query("
    SELECT t.*, COUNT(ti.id) AS item_count
    FROM transfers t
    LEFT JOIN transfer_items ti ON ti.transfer_id = t.id
    $where
    GROUP BY t.id ORDER BY t.created_at DESC
")->fetch_all(MYSQLI_ASSOC);

$products   = $conn->query("SELECT id, name, sku, unit, stock FROM products ORDER BY name")->fetch_all(MYSQLI_ASSOC);
$warehouses = $conn->query("SELECT * FROM warehouses ORDER BY name")->fetch_all(MYSQLI_ASSOC);

include __DIR__ . '/../includes/header.php';
?>

<div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;gap:16px;">
  <div class="page-header-left"><div class="page-title"><span>I</span>nternal Transfers</div><div class="page-subtitle">Move stock between warehouses or locations</div></div>
  <button class="btn btn-primary" data-modal-open="transferModal">
    <i data-feather="plus"></i> New Transfer
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
        <tr><th>Ref</th><th>From</th><th>To</th><th>Date</th><th>Items</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>
        <?php foreach ($transfers as $t): ?>
        <tr>
          <td class="td-mono"><?= e($t['ref_code']) ?></td>
          <td><?= e($t['from_warehouse']) ?></td>
          <td><?= e($t['to_warehouse']) ?></td>
          <td><?= e($t['transfer_date']) ?></td>
          <td><?= $t['item_count'] ?> line(s)</td>
          <td><?= badge($t['status']) ?></td>
          <td>
            <div class="flex gap-8" style="justify-content:flex-end;">
              <?php if ($t['status'] !== 'done' && $t['status'] !== 'cancelled'): ?>
              <form method="POST" style="display:inline;">
                <input type="hidden" name="action" value="validate">
                <input type="hidden" name="id" value="<?= $t['id'] ?>">
                <button type="submit" class="btn btn-success"
                  data-confirm="Validate transfer <?= e($t['ref_code']) ?>?">
                  <i data-feather="check-circle" style="width:13px;height:13px;"></i> Validate
                </button>
              </form>
              <form method="POST" style="display:inline;">
                <input type="hidden" name="action" value="cancel">
                <input type="hidden" name="id" value="<?= $t['id'] ?>">
                <button type="submit" class="btn btn-danger btn-sm"
                  data-confirm="Cancel transfer <?= e($t['ref_code']) ?>?">Cancel</button>
              </form>
              <?php endif; ?>
            </div>
          </td>
        </tr>
        <?php endforeach; ?>
        <?php if (empty($transfers)): ?>
          <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--slate-400);">No transfers found.</td></tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Modal -->
<div class="modal-overlay" id="transferModal">
  <div class="modal" style="max-width:580px;">
    <div class="modal-header">
      <h2>New Internal Transfer</h2>
      <button class="modal-close" data-modal-close><i data-feather="x"></i></button>
    </div>
    <form method="POST" action="transfers.php">
      <input type="hidden" name="action" value="create">
      <div class="modal-body">
        <div class="form-grid form-grid-2">
          <div class="form-group">
            <label>From Warehouse *</label>
            <select name="from_warehouse" class="form-control" required>
              <?php foreach ($warehouses as $w): ?>
                <option value="<?= e($w['name']) ?>"><?= e($w['name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label>To Warehouse *</label>
            <select name="to_warehouse" class="form-control" required>
              <?php foreach ($warehouses as $w): ?>
                <option value="<?= e($w['name']) ?>"><?= e($w['name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label>Transfer Date *</label>
            <input type="date" name="transfer_date" class="form-control" value="<?= date('Y-m-d') ?>" required>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <input type="text" name="notes" class="form-control" placeholder="Optional…">
          </div>
        </div>
        <hr class="divider">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <label style="font-weight:600;font-size:13px;">Product Lines</label>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addTrfLine()">+ Add Line</button>
        </div>
        <div class="line-items" id="trfLineItems">
          <div class="line-item">
            <select name="product_id[]" class="form-control" required>
              <option value="">Select product…</option>
              <?php foreach ($products as $p): ?>
                <option value="<?= $p['id'] ?>"><?= e($p['name']) ?> (<?= $p['stock']+0 ?> <?= e($p['unit']) ?>)</option>
              <?php endforeach; ?>
            </select>
            <input type="number" name="qty[]" class="form-control" placeholder="Qty" min="0.01" step="0.01" required>
            <button type="button" class="btn-icon" onclick="removeTrfLine(this)" style="color:var(--red-500);">
              <i data-feather="x"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn-primary">Create Transfer</button>
      </div>
    </form>
  </div>
</div>

<?php
$productJson = json_encode($products);
$extraScript = <<<JS
<script>
const trfProducts = $productJson;
function trfOptions() {
  return trfProducts.map(p => `<option value="\${p.id}">\${p.name} (\${p.stock} \${p.unit})</option>`).join('');
}
function addTrfLine() {
  const div = document.createElement('div');
  div.className = 'line-item';
  div.innerHTML = `
    <select name="product_id[]" class="form-control" required>
      <option value="">Select product…</option>\${trfOptions()}
    </select>
    <input type="number" name="qty[]" class="form-control" placeholder="Qty" min="0.01" step="0.01" required>
    <button type="button" class="btn-icon" onclick="removeTrfLine(this)" style="color:var(--red-500);">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>`;
  document.getElementById('trfLineItems').appendChild(div);
}
function removeTrfLine(btn) {
  if (document.querySelectorAll('#trfLineItems .line-item').length > 1)
    btn.closest('.line-item').remove();
}
</script>
JS;
include __DIR__ . '/../includes/footer.php';
?>
