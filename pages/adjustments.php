<?php
require_once __DIR__ . '/../includes/config.php';
requireLogin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'create') {
        $reason = trim($_POST['reason']);
        $date   = $_POST['adj_date'];
        $ref    = genRef($conn, 'ADJ', 'adjustments');

        $stmt = $conn->prepare("INSERT INTO adjustments (ref_code, reason, adj_date) VALUES (?,?,?)");
        $stmt->bind_param('sss', $ref, $reason, $date);
        $stmt->execute();
        $adjId = $conn->insert_id;

        foreach ($_POST['product_id'] ?? [] as $i => $pid) {
            if (!$pid) continue;
            $counted  = (float)($_POST['counted_qty'][$i] ?? 0);
            $current  = (float)$conn->query("SELECT stock FROM products WHERE id=$pid")->fetch_assoc()['stock'];
            $diff     = $counted - $current;    // positive = add, negative = reduce

            $stmt = $conn->prepare("INSERT INTO adjustment_items (adjustment_id, product_id, qty) VALUES (?,?,?)");
            $stmt->bind_param('iid', $adjId, $pid, $diff);
            $stmt->execute();

            $conn->query("UPDATE products SET stock = GREATEST(0, stock + ($diff)) WHERE id=$pid");
            $after = (float)$conn->query("SELECT stock FROM products WHERE id=$pid")->fetch_assoc()['stock'];

            $note = "Adjustment $ref: $reason (counted $counted, was $current)";
            $type = 'adjustment';
            $stmt = $conn->prepare("INSERT INTO stock_ledger (product_id, move_type, ref_code, qty_change, stock_after, note) VALUES (?,?,?,?,?,?)");
            $stmt->bind_param('issdds', $pid, $type, $ref, $diff, $after, $note);
            $stmt->execute();
        }
        setFlash('success', "Stock adjustment $ref applied.");
    }

    header('Location: adjustments.php');
    exit;
}

$adjustments = $conn->query("
    SELECT a.*, COUNT(ai.id) AS item_count
    FROM adjustments a
    LEFT JOIN adjustment_items ai ON ai.adjustment_id = a.id
    GROUP BY a.id ORDER BY a.created_at DESC
")->fetch_all(MYSQLI_ASSOC);

$products = $conn->query("SELECT id, name, sku, unit, stock FROM products ORDER BY name")->fetch_all(MYSQLI_ASSOC);

include __DIR__ . '/../includes/header.php';
?>

<div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;gap:16px;">
  <div class="page-header-left"><div class="page-title"><span>S</span>tock Adjustments</div><div class="page-subtitle">Fix mismatches between recorded and physical counts</div></div>
  <button class="btn btn-primary" data-modal-open="adjModal">
    <i data-feather="plus"></i> New Adjustment
  </button>
</div>

<!-- Info banner -->
<div style="background:var(--blue-100);border:1px solid #bfdbfe;border-radius:var(--radius-lg);padding:14px 18px;display:flex;gap:12px;margin-bottom:20px;">
  <i data-feather="info" style="color:#1d4ed8;flex-shrink:0;margin-top:1px;"></i>
  <p style="font-size:13px;color:#1e40af;">
    Enter the <strong>physically counted quantity</strong> for each product. The system will automatically calculate the difference and update the stock level.
  </p>
</div>

<div class="glass-panel">
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Ref</th><th>Reason</th><th>Date</th><th>Items Adjusted</th><th>Created At</th></tr>
      </thead>
      <tbody>
        <?php foreach ($adjustments as $a): ?>
        <tr>
          <td class="td-mono"><?= e($a['ref_code']) ?></td>
          <td style="font-weight:600;"><?= e($a['reason']) ?></td>
          <td><?= e($a['adj_date']) ?></td>
          <td><?= $a['item_count'] ?> product(s)</td>
          <td style="color:var(--slate-400);font-size:12px;"><?= date('d M Y H:i', strtotime($a['created_at'])) ?></td>
        </tr>
        <?php endforeach; ?>
        <?php if (empty($adjustments)): ?>
          <tr><td colspan="5" style="text-align:center;padding:40px;color:var(--slate-400);">No adjustments yet.</td></tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- New Adjustment Modal -->
<div class="modal-overlay" id="adjModal">
  <div class="modal" style="max-width:600px;">
    <div class="modal-header">
      <h2>New Stock Adjustment</h2>
      <button class="modal-close" data-modal-close><i data-feather="x"></i></button>
    </div>
    <form method="POST" action="adjustments.php">
      <input type="hidden" name="action" value="create">
      <div class="modal-body">
        <div class="form-grid form-grid-2">
          <div class="form-group" style="grid-column:1/-1;">
            <label>Reason for Adjustment *</label>
            <input type="text" name="reason" class="form-control" placeholder="e.g. Damaged goods, Annual count, Theft…" required>
          </div>
          <div class="form-group">
            <label>Adjustment Date *</label>
            <input type="date" name="adj_date" class="form-control" value="<?= date('Y-m-d') ?>" required>
          </div>
        </div>

        <hr class="divider">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <label style="font-weight:600;font-size:13px;">Products to Adjust</label>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addAdjLine()">+ Add Product</button>
        </div>
        <p style="font-size:12px;color:var(--slate-400);margin-bottom:10px;">
          Enter the <strong>physically counted</strong> quantity. System will show the difference.
        </p>

        <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:6px;margin-bottom:6px;font-size:11px;font-weight:600;color:var(--slate-400);text-transform:uppercase;letter-spacing:.04em;padding:0 4px;">
          <span>Product</span><span>System Stock</span><span>Counted Qty</span>
        </div>
        <div id="adjLineItems" class="line-items"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn-primary">Apply Adjustment</button>
      </div>
    </form>
  </div>
</div>

<?php
$productJson = json_encode($products);
$extraScript = <<<JS
<script>
const adjProducts = $productJson;

function addAdjLine() {
  const div = document.createElement('div');
  div.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr;gap:6px;align-items:center;margin-bottom:6px;';
  div.innerHTML = `
    <select name="product_id[]" class="form-control" onchange="fillStock(this)" required>
      <option value="">Select product…</option>
      \${adjProducts.map(p => `<option value="\${p.id}" data-stock="\${p.stock}" data-unit="\${p.unit}">\${p.name} (\${p.sku})</option>`).join('')}
    </select>
    <div style="display:flex;align-items:center;gap:4px;">
      <input type="text" class="form-control sys-stock" placeholder="—" readonly style="background:var(--slate-50);cursor:default;">
    </div>
    <input type="number" name="counted_qty[]" class="form-control" placeholder="Counted" min="0" step="0.01" required>`;
  document.getElementById('adjLineItems').appendChild(div);
}

function fillStock(select) {
  const opt   = select.selectedOptions[0];
  const stock = opt ? opt.dataset.stock : '';
  const unit  = opt ? opt.dataset.unit  : '';
  const input = select.closest('div[style]').querySelector('.sys-stock');
  input.value = stock ? stock + ' ' + unit : '';
}

addAdjLine(); // start with one line
</script>
JS;
include __DIR__ . '/../includes/footer.php';
?>
