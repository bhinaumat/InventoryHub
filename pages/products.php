<?php
require_once __DIR__ . '/../includes/config.php';
requireLogin();

// ── Handle POST actions ────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'create' || $action === 'edit') {
        $name     = trim($_POST['name']);
        $sku      = trim($_POST['sku']);
        $cat_id   = (int)$_POST['category_id'];
        $unit     = $_POST['unit'];
        $stock    = (float)$_POST['stock'];
        $minStock = (float)$_POST['min_stock'];
        $whId     = (int)$_POST['warehouse_id'];

        if ($action === 'create') {
            $stmt = $conn->prepare("INSERT INTO products (name, sku, category_id, unit, stock, min_stock, warehouse_id) VALUES (?,?,?,?,?,?,?)");
            $stmt->bind_param('ssissdi', $name, $sku, $cat_id, $unit, $stock, $minStock, $whId);
            $stmt->execute();
            setFlash('success', "Product '$name' created successfully.");
        } else {
            $id = (int)$_POST['id'];
            $stmt = $conn->prepare("UPDATE products SET name=?, sku=?, category_id=?, unit=?, stock=?, min_stock=?, warehouse_id=? WHERE id=?");
            $stmt->bind_param('ssissdii', $name, $sku, $cat_id, $unit, $stock, $minStock, $whId, $id);
            $stmt->execute();
            setFlash('success', "Product updated.");
        }
    }

    if ($action === 'delete') {
        $id = (int)$_POST['id'];
        $conn->query("DELETE FROM products WHERE id=$id");
        setFlash('success', "Product deleted.");
    }

    header('Location: products.php');
    exit;
}

// ── Filters ────────────────────────────────────────────────
$search  = trim($_GET['q'] ?? '');
$catFilt = (int)($_GET['cat'] ?? 0);
$whFilt  = (int)($_GET['wh'] ?? 0);

$where = ["1=1"];
$params = [];
$types  = '';
if ($search) { $where[] = "(p.name LIKE ? OR p.sku LIKE ?)"; $like = "%$search%"; $params[] = &$like; $params[] = &$like; $types .= 'ss'; }
if ($catFilt) { $where[] = "p.category_id = ?"; $params[] = &$catFilt; $types .= 'i'; }
if ($whFilt)  { $where[] = "p.warehouse_id = ?"; $params[] = &$whFilt; $types .= 'i'; }

$sql = "SELECT p.*, c.name AS category_name, w.name AS warehouse_name
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN warehouses  w ON w.id = p.warehouse_id
        WHERE " . implode(' AND ', $where) . " ORDER BY p.name";

$stmt = $conn->prepare($sql);
if ($types) {
    array_unshift($params, $types);
    call_user_func_array([$stmt, 'bind_param'], $params);
}
$stmt->execute();
$products = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

$categories = $conn->query("SELECT * FROM categories ORDER BY name")->fetch_all(MYSQLI_ASSOC);
$warehouses = $conn->query("SELECT * FROM warehouses ORDER BY name")->fetch_all(MYSQLI_ASSOC);

include __DIR__ . '/../includes/header.php';
?>

<div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;gap:16px;">
  <div class="page-header-left"><div class="page-title"><span>P</span>roducts</div><div class="page-subtitle"><?= count($products) ?> product(s) found</div></div>
  <button class="btn btn-primary" data-modal-open="productModal">
    <i data-feather="plus"></i> New Product
  </button>
</div>

<!-- Filters -->
<div class="filters-bar">
  <form method="GET" style="display:contents;">
    <div class="search-wrap">
      <i data-feather="search" style="width:15px;height:15px;"></i>
      <input type="text" name="q" class="form-control" placeholder="Search name or SKU…" value="<?= e($search) ?>" style="width:220px;">
    </div>
    <select name="cat" class="form-control" style="width:160px;">
      <option value="">All Categories</option>
      <?php foreach ($categories as $c): ?>
        <option value="<?= $c['id'] ?>" <?= $catFilt == $c['id'] ? 'selected' : '' ?>><?= e($c['name']) ?></option>
      <?php endforeach; ?>
    </select>
    <select name="wh" class="form-control" style="width:180px;">
      <option value="">All Warehouses</option>
      <?php foreach ($warehouses as $w): ?>
        <option value="<?= $w['id'] ?>" <?= $whFilt == $w['id'] ? 'selected' : '' ?>><?= e($w['name']) ?></option>
      <?php endforeach; ?>
    </select>
    <button type="submit" class="btn btn-secondary btn-sm">Filter</button>
    <a href="products.php" class="btn btn-secondary btn-sm">Reset</a>
  </form>
</div>

<!-- Table -->
<div class="glass-panel">
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Product Name</th>
          <th>SKU</th>
          <th>Category</th>
          <th>Warehouse</th>
          <th>Unit</th>
          <th style="text-align:right;">Stock</th>
          <th style="text-align:right;">Min Stock</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($products as $p):
          $cls = $p['stock'] == 0 ? 'stock-out' : ($p['stock'] < $p['min_stock'] ? 'stock-low' : 'stock-ok');
        ?>
        <tr>
          <td style="font-weight:600;"><?= e($p['name']) ?></td>
          <td class="td-mono"><?= e($p['sku']) ?></td>
          <td><?= e($p['category_name'] ?? '—') ?></td>
          <td><?= e($p['warehouse_name'] ?? '—') ?></td>
          <td><?= e($p['unit']) ?></td>
          <td style="text-align:right;" class="<?= $cls ?>"><?= $p['stock']+0 ?> <?= e($p['unit']) ?></td>
          <td style="text-align:right;color:var(--slate-400);"><?= $p['min_stock']+0 ?></td>
          <td>
            <div class="flex gap-8" style="justify-content:flex-end;">
              <button class="btn-icon" title="Edit"
                onclick="openEdit(<?= htmlspecialchars(json_encode($p), ENT_QUOTES) ?>)">
                <i data-feather="edit-2"></i>
              </button>
              <form method="POST" style="display:inline;">
                <input type="hidden" name="action" value="delete">
                <input type="hidden" name="id" value="<?= $p['id'] ?>">
                <button type="submit" class="btn-icon" style="color:var(--red-500);"
                  data-confirm="Delete product '<?= e($p['name']) ?>'?">
                  <i data-feather="trash-2"></i>
                </button>
              </form>
            </div>
          </td>
        </tr>
        <?php endforeach; ?>
        <?php if (empty($products)): ?>
          <tr><td colspan="8" style="text-align:center;padding:40px;color:var(--slate-400);">No products found.</td></tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Create / Edit Modal -->
<div class="modal-overlay" id="productModal">
  <div class="modal">
    <div class="modal-header">
      <h2 id="modalTitle">New Product</h2>
      <button class="modal-close" data-modal-close><i data-feather="x"></i></button>
    </div>
    <form method="POST" action="products.php">
      <input type="hidden" name="action" id="formAction" value="create">
      <input type="hidden" name="id" id="formId" value="">
      <div class="modal-body">
        <div class="form-grid form-grid-2">
          <div class="form-group">
            <label>Product Name *</label>
            <input type="text" name="name" id="fName" class="form-control" placeholder="e.g. Steel Rods" required>
          </div>
          <div class="form-group">
            <label>SKU / Code *</label>
            <input type="text" name="sku" id="fSku" class="form-control" placeholder="e.g. STL-001" required>
          </div>
          <div class="form-group">
            <label>Category</label>
            <select name="category_id" id="fCat" class="form-control">
              <?php foreach ($categories as $c): ?>
                <option value="<?= $c['id'] ?>"><?= e($c['name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label>Unit of Measure</label>
            <select name="unit" id="fUnit" class="form-control">
              <?php foreach (['pcs','kg','m','l','box'] as $u): ?>
                <option value="<?= $u ?>"><?= $u ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label>Stock Quantity</label>
            <input type="number" name="stock" id="fStock" class="form-control" value="0" min="0" step="0.01">
          </div>
          <div class="form-group">
            <label>Minimum Stock</label>
            <input type="number" name="min_stock" id="fMinStock" class="form-control" value="10" min="0" step="0.01">
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label>Warehouse</label>
            <select name="warehouse_id" id="fWarehouse" class="form-control">
              <?php foreach ($warehouses as $w): ?>
                <option value="<?= $w['id'] ?>"><?= e($w['name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn-primary" id="submitBtn">Create Product</button>
      </div>
    </form>
  </div>
</div>

<?php
$extraScript = <<<JS
<script>
function openEdit(p) {
  document.getElementById('modalTitle').textContent = 'Edit Product';
  document.getElementById('formAction').value  = 'edit';
  document.getElementById('formId').value      = p.id;
  document.getElementById('fName').value       = p.name;
  document.getElementById('fSku').value        = p.sku;
  document.getElementById('fCat').value        = p.category_id;
  document.getElementById('fUnit').value       = p.unit;
  document.getElementById('fStock').value      = p.stock;
  document.getElementById('fMinStock').value   = p.min_stock;
  document.getElementById('fWarehouse').value  = p.warehouse_id;
  document.getElementById('submitBtn').textContent = 'Save Changes';
  document.getElementById('productModal').classList.add('open');
}
</script>
JS;
include __DIR__ . '/../includes/footer.php';
?>
