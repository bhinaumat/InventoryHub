<?php
require_once __DIR__ . '/includes/config.php';

if (!empty($_SESSION['user_id'])) {
    header('Location: /inventoryhub/pages/dashboard.php');
    exit;
}

$loginError    = '';
$registerError = '';
$registerOk    = '';
$activeTab     = 'login';

// ── SIGN IN ──────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'login') {
    $activeTab = 'login';
    $email     = trim($_POST['email'] ?? '');
    $password  = $_POST['password'] ?? '';

    $stmt = $conn->prepare("SELECT id, name, role, password FROM users WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id']   = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_role'] = $user['role'];
        header('Location: /inventoryhub/pages/dashboard.php');
        exit;
    } else {
        $loginError = 'Invalid credentials. Access denied.';
    }
}

// ── CREATE ACCOUNT ───────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'register') {
    $activeTab = 'register';
    $name      = trim($_POST['reg_name']  ?? '');
    $email     = trim($_POST['reg_email'] ?? '');
    $password  = $_POST['reg_password']   ?? '';
    $confirm   = $_POST['reg_confirm']    ?? '';
    $role      = in_array($_POST['reg_role'] ?? '', ['manager','staff']) ? $_POST['reg_role'] : 'staff';

    if (!$name || !$email || !$password || !$confirm) {
        $registerError = 'All fields are required.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $registerError = 'Invalid email address.';
    } elseif (strlen($password) < 6) {
        $registerError = 'Password must be at least 6 characters.';
    } elseif ($password !== $confirm) {
        $registerError = 'Passwords do not match.';
    } else {
        $chk = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $chk->bind_param('s', $email);
        $chk->execute();
        $chk->store_result();
        if ($chk->num_rows > 0) {
            $registerError = 'This email is already registered.';
        } else {
            $hashed = password_hash($password, PASSWORD_DEFAULT);
            $ins = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)");
            $ins->bind_param('ssss', $name, $email, $hashed, $role);
            if ($ins->execute()) {
                $registerOk = "Account initialised. You may now sign in.";
                $activeTab  = 'login';
            } else {
                $registerError = 'System error. Please retry.';
            }
        }
    }
}

function eyeIcon() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= APP_NAME ?> — Access Portal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/inventoryhub/assets/css/style.css">
<style>
/* Login-page specific extras */
.hero-text {
  text-align: center;
  margin-bottom: 60px;
  position: relative; z-index: 10;
  animation: heroFadeIn 1s ease 0.3s both;
}
@keyframes heroFadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hero-text h1 {
  font-family: 'Orbitron', monospace;
  font-size: clamp(32px, 6vw, 58px);
  font-weight: 900;
  letter-spacing: 8px;
  text-transform: uppercase;
  color: var(--text-primary);
  line-height: 1.1;
  margin-bottom: 12px;
}
.hero-text h1 .accent { color: var(--neon-cyan); text-shadow: var(--glow-cyan); }
.hero-text p {
  font-family: 'Rajdhani', sans-serif;
  font-size: 15px;
  letter-spacing: 4px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.login-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 80px;
  width: 100%;
  max-width: 1200px;
  position: relative; z-index: 10;
  flex-wrap: wrap;
}

/* Feature list on left */
.feature-list {
  flex: 0 0 300px;
  animation: featuresFadeIn 1s ease 0.5s both;
}
@keyframes featuresFadeIn {
  from { opacity: 0; transform: translateX(-30px); }
  to   { opacity: 1; transform: translateX(0); }
}
.feature-item {
  display: flex; align-items: flex-start; gap: 14px;
  margin-bottom: 24px;
  padding: 14px 16px;
  background: rgba(0,212,255,0.03);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  transition: all 0.3s;
}
.feature-item:hover {
  background: rgba(0,212,255,0.06);
  border-color: var(--border-neon);
  transform: translateX(6px);
}
.feature-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  box-shadow: 0 0 8px currentColor;
}
.feature-dot.cyan   { background: var(--neon-cyan);   color: var(--neon-cyan); }
.feature-dot.green  { background: var(--neon-green);  color: var(--neon-green); }
.feature-dot.violet { background: var(--neon-violet); color: var(--neon-violet); }
.feature-dot.amber  { background: var(--neon-amber);  color: var(--neon-amber); }
.feature-dot.red    { background: var(--neon-red);    color: var(--neon-red); }
.feature-item h3 { font-family: 'Orbitron', monospace; font-size: 11px; letter-spacing: 1px; color: var(--text-primary); margin-bottom: 3px; }
.feature-item p  { font-size: 12px; color: var(--text-muted); line-height: 1.5; }

/* HUD lines around canvas */
.hud-corner {
  position: absolute;
  width: 40px; height: 40px;
  opacity: 0.4;
}
.hud-tl { top: 20px; left: 20px; border-top: 2px solid var(--neon-cyan); border-left: 2px solid var(--neon-cyan); border-radius: 4px 0 0 0; }
.hud-tr { top: 20px; right: 20px; border-top: 2px solid var(--neon-cyan); border-right: 2px solid var(--neon-cyan); border-radius: 0 4px 0 0; }
.hud-bl { bottom: 20px; left: 20px; border-bottom: 2px solid var(--neon-violet); border-left: 2px solid var(--neon-violet); border-radius: 0 0 0 4px; }
.hud-br { bottom: 20px; right: 20px; border-bottom: 2px solid var(--neon-violet); border-right: 2px solid var(--neon-violet); border-radius: 0 0 4px 0; }

/* Status bar at bottom */
.status-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  height: 28px;
  background: rgba(2,4,8,0.9);
  border-top: 1px solid var(--border-subtle);
  display: flex; align-items: center;
  padding: 0 20px; gap: 20px;
  z-index: 200;
  backdrop-filter: blur(10px);
}
.status-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--neon-green);
  box-shadow: 0 0 6px var(--neon-green);
  animation: statusPulse 2s ease-in-out infinite;
}
@keyframes statusPulse {
  0%,100% { opacity: 1; } 50% { opacity: 0.4; }
}
.status-text {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--text-muted);
  text-transform: uppercase;
}
.status-text span { color: var(--neon-green); }
</style>
</head>
<body>

<!-- Scanlines overlay -->
<div class="scanlines"></div>

<!-- HUD corners -->
<div class="hud-corner hud-tl"></div>
<div class="hud-corner hud-tr"></div>
<div class="hud-corner hud-bl"></div>
<div class="hud-corner hud-br"></div>

<!-- Particle canvas -->
<canvas id="particleCanvas"></canvas>

<!-- Background orbs -->
<div class="orb orb-1"></div>
<div class="orb orb-2"></div>
<div class="orb orb-3"></div>

<div class="login-scene">

  <!-- Hero headline -->
  <div class="hero-text" style="position:absolute;top:40px;left:0;right:0;">
    <p style="font-family:'Orbitron',monospace;font-size:10px;letter-spacing:5px;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px;">
      ▸ SYSTEM ONLINE ▸ INVENTORY MANAGEMENT ▸
    </p>
  </div>

  <div class="login-layout">

    <!-- Left: Feature list -->
    <div class="feature-list" style="display:none;" id="featureList">
      <!-- shown on wider screens via JS -->
    </div>

    <!-- Right: Login card -->
    <div class="login-card" style="animation-delay:0.2s;">
      <div class="bracket-tl"></div>
      <div class="bracket-br"></div>

      <!-- Logo -->
      <div class="login-logo">
        <div class="logo-ring">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 8px var(--neon-cyan))">
            <rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/>
            <rect x="15" y="14" width="7" height="7"/><rect x="2" y="14" width="7" height="7"/>
          </svg>
        </div>
        <h1>Inventory<span>Hub</span></h1>
        <p>Warehouse Control System<span class="cursor-blink"></span></p>
      </div>

      <!-- Tabs -->
      <div class="tab-bar">
        <button class="tab-btn <?= $activeTab === 'login'    ? 'active' : '' ?>" onclick="switchTab('login')">Sign In</button>
        <button class="tab-btn <?= $activeTab === 'register' ? 'active' : '' ?>" onclick="switchTab('register')">New Account</button>
      </div>

      <!-- ── LOGIN PANEL ──────────────────────────────── -->
      <div id="panel-login" <?= $activeTab === 'register' ? 'class="hidden"' : '' ?>>

        <?php if ($registerOk): ?>
          <div class="flash-ok">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <?= e($registerOk) ?>
          </div>
        <?php endif; ?>

        <?php if ($loginError): ?>
          <div class="flash flash-error" style="margin-bottom:16px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <?= e($loginError) ?>
          </div>
        <?php endif; ?>

        <form method="POST" action="">
          <input type="hidden" name="action" value="login">
          <div class="form-group" style="margin-bottom:14px;">
            <label>Access ID (Email)</label>
            <input type="email" name="email" class="form-control"
                   value="<?= e($_POST['email'] ?? '') ?>"
                   placeholder="operator@hub.io" required autofocus>
          </div>
          <div class="form-group" style="margin-bottom:18px;">
            <label>Auth Key (Password)</label>
            <div class="pw-wrap">
              <input type="password" name="password" id="loginPw" class="form-control" placeholder="••••••••••" required>
              <button type="button" class="pw-eye" onclick="togglePw('loginPw',this)"><?= eyeIcon() ?></button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary login-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Authorise Access
          </button>
        </form>

        <p style="text-align:center;font-size:11px;color:var(--text-muted);margin-top:18px;font-family:'Orbitron',monospace;letter-spacing:1px;">
          DEMO ▸ manager@hub.io / password
        </p>
        <p style="text-align:center;font-size:13px;color:var(--text-muted);margin-top:10px;">
          No account?
          <button onclick="switchTab('register')" style="background:none;border:none;color:var(--neon-cyan);font-weight:600;cursor:pointer;font-size:13px;font-family:'Rajdhani',sans-serif;text-shadow:0 0 8px rgba(0,212,255,0.5);">Register →</button>
        </p>
      </div>

      <!-- ── REGISTER PANEL ────────────────────────── -->
      <div id="panel-register" <?= $activeTab === 'login' ? 'class="hidden"' : '' ?>>

        <?php if ($registerError): ?>
          <div class="flash flash-error" style="margin-bottom:16px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <?= e($registerError) ?>
          </div>
        <?php endif; ?>

        <form method="POST" action="">
          <input type="hidden" name="action" value="register">

          <div class="form-group" style="margin-bottom:12px;">
            <label>Operator Name *</label>
            <input type="text" name="reg_name" class="form-control"
                   value="<?= e($_POST['reg_name'] ?? '') ?>"
                   placeholder="e.g. John Smith" required>
          </div>
          <div class="form-group" style="margin-bottom:12px;">
            <label>Email Address *</label>
            <input type="email" name="reg_email" class="form-control"
                   value="<?= e($_POST['reg_email'] ?? '') ?>"
                   placeholder="operator@hub.io" required>
          </div>
          <div class="form-group" style="margin-bottom:12px;">
            <label>Password * <span style="font-family:'Rajdhani',sans-serif;font-size:10px;color:var(--text-muted);letter-spacing:0;font-weight:400;">(min 6 chars)</span></label>
            <div class="pw-wrap">
              <input type="password" name="reg_password" id="regPw" class="form-control"
                     placeholder="Create password" required oninput="checkStrength(this.value)">
              <button type="button" class="pw-eye" onclick="togglePw('regPw',this)"><?= eyeIcon() ?></button>
            </div>
            <div class="strength-bar"><div class="strength-fill" id="sFill"></div></div>
            <div class="strength-lbl" id="sLbl">awaiting input</div>
          </div>
          <div class="form-group" style="margin-bottom:14px;">
            <label>Confirm Password *</label>
            <div class="pw-wrap">
              <input type="password" name="reg_confirm" id="regConfirm" class="form-control"
                     placeholder="Repeat password" required oninput="checkMatch()">
              <button type="button" class="pw-eye" onclick="togglePw('regConfirm',this)"><?= eyeIcon() ?></button>
            </div>
            <div class="strength-lbl" id="mLbl"></div>
          </div>

          <div class="form-group" style="margin-bottom:18px;">
            <label>Access Level</label>
            <div class="role-grid">
              <div class="role-option">
                <input type="radio" name="reg_role" id="roleManager" value="manager"
                       <?= (($_POST['reg_role'] ?? '') === 'manager') ? 'checked' : '' ?>>
                <label class="role-label" for="roleManager">
                  <div class="role-icon">🏢</div>
                  <div class="role-name">Manager</div>
                  <div class="role-desc">Full system access</div>
                </label>
              </div>
              <div class="role-option">
                <input type="radio" name="reg_role" id="roleStaff" value="staff"
                       <?= (($_POST['reg_role'] ?? 'staff') !== 'manager') ? 'checked' : '' ?>>
                <label class="role-label" for="roleStaff">
                  <div class="role-icon">📦</div>
                  <div class="role-name">Staff</div>
                  <div class="role-desc">Warehouse operations</div>
                </label>
              </div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary login-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Initialise Account
          </button>
        </form>

        <p style="text-align:center;font-size:13px;color:var(--text-muted);margin-top:14px;">
          Already registered?
          <button onclick="switchTab('login')" style="background:none;border:none;color:var(--neon-cyan);font-weight:600;cursor:pointer;font-size:13px;font-family:'Rajdhani',sans-serif;text-shadow:0 0 8px rgba(0,212,255,0.5);">Sign in →</button>
        </p>
      </div>

    </div><!-- /login-card -->
  </div><!-- /login-layout -->
</div><!-- /login-scene -->

<!-- Status bar -->
<div class="status-bar">
  <div class="status-dot"></div>
  <span class="status-text">SYSTEM <span>ONLINE</span></span>
  <span class="status-text" style="margin-left:auto;" id="sysClock"></span>
</div>

<script>
// ── Tab switch ────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById('panel-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('panel-register').classList.toggle('hidden', tab !== 'register');
  document.querySelectorAll('.tab-btn').forEach((b,i) => {
    b.classList.toggle('active', (i===0)===(tab==='login'));
  });
}

// ── Password show/hide ────────────────────────────────────
function togglePw(id, btn) {
  const inp = document.getElementById(id);
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.innerHTML = show
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

// ── Strength meter ────────────────────────────────────────
function checkStrength(pw) {
  let s=0;
  if(pw.length>=6) s++;
  if(pw.length>=10) s++;
  if(/[A-Z]/.test(pw)) s++;
  if(/[0-9]/.test(pw)) s++;
  if(/[^A-Za-z0-9]/.test(pw)) s++;
  const L=[
    {w:'20%',bg:'#ff3366',t:'CRITICAL'},
    {w:'40%',bg:'#ff6600',t:'WEAK'},
    {w:'60%',bg:'#ffaa00',t:'MODERATE'},
    {w:'80%',bg:'#00d4ff',t:'STRONG'},
    {w:'100%',bg:'#00ff88',t:'SECURE'},
  ];
  const l=L[Math.min(s,4)];
  const f=document.getElementById('sFill'), lb=document.getElementById('sLbl');
  f.style.width=pw?l.w:'0%'; f.style.background=l.bg;
  lb.textContent=pw?l.t:'awaiting input'; lb.style.color=pw?l.bg:'var(--text-muted)';
}
function checkMatch() {
  const pw=document.getElementById('regPw').value;
  const cn=document.getElementById('regConfirm').value;
  const lb=document.getElementById('mLbl');
  if(!cn){lb.textContent='';return;}
  lb.textContent=pw===cn?'▸ MATCH CONFIRMED':'▸ MISMATCH DETECTED';
  lb.style.color=pw===cn?'var(--neon-green)':'var(--neon-red)';
}

// ── Particle canvas ───────────────────────────────────────
(function() {
  const canvas = document.getElementById('particleCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const COLORS = ['#00d4ff','#0080ff','#7c3aff','#00ff88','rgba(0,212,255,0.3)'];

  function mkParticle() {
    return {
      x: Math.random() * W,
      y: H + 10,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.8 + 0.3,
      drift: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      pulse: Math.random() * Math.PI * 2,
    };
  }

  for (let i = 0; i < 80; i++) {
    const p = mkParticle();
    p.y = Math.random() * H;
    particles.push(p);
  }

  // Stars
  const stars = Array.from({length:120}, () => ({
    x: Math.random() * 1920,
    y: Math.random() * 1080,
    r: Math.random() * 1.2 + 0.2,
    op: Math.random() * 0.4 + 0.05,
    pulse: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.02 + 0.005,
  }));

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    frame++;

    // Draw stars
    stars.forEach(s => {
      s.pulse += s.speed;
      const op = s.op * (0.7 + 0.3 * Math.sin(s.pulse));
      ctx.beginPath();
      ctx.arc(s.x % W, s.y % H, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(200,230,255,${op})`;
      ctx.fill();
    });

    // Draw particles
    particles.forEach((p, i) => {
      p.pulse += 0.03;
      const op = p.opacity * (0.8 + 0.2 * Math.sin(p.pulse));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fillStyle = p.color.startsWith('rgba') ? p.color : p.color + Math.floor(op * 255).toString(16).padStart(2,'0');
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      p.y -= p.speed;
      p.x += p.drift;

      if (p.y < -10) {
        particles[i] = mkParticle();
      }
    });

    // Connection lines between close particles
    if (frame % 3 === 0) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i+1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,212,255,${0.06 * (1 - dist/80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
})();

// ── 3D tilt effect on login card ─────────────────────────
const card = document.querySelector('.login-card');
if (card) {
  document.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) / window.innerWidth;
    const dy = (e.clientY - cy) / window.innerHeight;
    card.style.transform = `perspective(800px) rotateY(${dx * 8}deg) rotateX(${-dy * 6}deg) translateZ(0)`;
  });
  document.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateY(0) rotateX(0)';
  });
}

// ── System clock ──────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const t = now.toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const d = now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
  const el = document.getElementById('sysClock');
  if (el) el.textContent = `${d} ▸ ${t}`;
}
setInterval(updateClock, 1000);
updateClock();

// ── Typing effect on subtitle ─────────────────────────────
(function() {
  const phrases = ['Warehouse Control System','Inventory Operations','Stock Management Hub','Supply Chain Control'];
  let pi = 0, ci = 0, deleting = false;
  const el = document.querySelector('.login-logo p');
  if (!el) return;
  function type() {
    const phrase = phrases[pi];
    if (!deleting) {
      el.childNodes[0].textContent = phrase.slice(0, ++ci);
      if (ci === phrase.length) { deleting = true; setTimeout(type, 2000); return; }
    } else {
      el.childNodes[0].textContent = phrase.slice(0, --ci);
      if (ci === 0) { deleting = false; pi = (pi+1) % phrases.length; }
    }
    setTimeout(type, deleting ? 40 : 80);
  }
  // Wrap text in a span to separate from cursor
  const text = el.textContent.replace('|','');
  el.innerHTML = `<span></span><span class="cursor-blink"></span>`;
  setTimeout(type, 500);
})();
</script>
</body>
</html>
