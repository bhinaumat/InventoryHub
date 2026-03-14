  </main><!-- end main-content -->
</div><!-- end app-shell -->

<script>
feather.replace({ width: 16, height: 16 });

// ── Flash auto-hide ───────────────────────────────────────
const flash = document.querySelector('.flash');
if (flash) setTimeout(() => { flash.style.opacity='0'; flash.style.transform='translateY(-4px)'; }, 4000);

// ── Confirm dialogs ───────────────────────────────────────
document.querySelectorAll('[data-confirm]').forEach(el => {
  el.addEventListener('click', e => { if (!confirm(el.dataset.confirm)) e.preventDefault(); });
});

// ── 3D Modal system ───────────────────────────────────────
document.querySelectorAll('[data-modal-open]').forEach(btn => {
  btn.addEventListener('click', () => {
    const ov = document.getElementById(btn.dataset.modalOpen);
    ov.classList.add('open');
    // Add backdrop div if not present
    if (!ov.querySelector('.modal-backdrop')) {
      const bd = document.createElement('div');
      bd.className = 'modal-backdrop';
      ov.insertBefore(bd, ov.firstChild);
    }
  });
});
document.querySelectorAll('[data-modal-close]').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('.modal-overlay').classList.remove('open'));
});
document.querySelectorAll('.modal-overlay').forEach(ov => {
  ov.addEventListener('click', e => { if (e.target === ov || e.target.classList.contains('modal-backdrop')) ov.classList.remove('open'); });
});

// ── KPI card 3D tilt on mouse ─────────────────────────────
document.querySelectorAll('.kpi-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform = `translateY(-6px) rotateX(${-y*12}deg) rotateY(${x*12}deg) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ── Live clock in topbar ──────────────────────────────────
function tick() {
  const el = document.getElementById('liveClock');
  if (el) el.textContent = new Date().toLocaleTimeString('en-GB');
}
setInterval(tick, 1000); tick();

// ── Background particle canvas ────────────────────────────
(function() {
  const canvas = document.getElementById('bgParticles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, pts = [];

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();

  for (let i = 0; i < 50; i++) pts.push({
    x: Math.random()*W, y: Math.random()*H,
    vx: (Math.random()-.5)*.3, vy: (Math.random()-.5)*.3,
    r: Math.random()*1.5+.3, op: Math.random()*.4+.1,
  });

  function draw() {
    ctx.clearRect(0,0,W,H);
    pts.forEach(p => {
      p.x = (p.x+p.vx+W)%W; p.y = (p.y+p.vy+H)%H;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(0,212,255,${p.op})`; ctx.fill();
    });
    // Connect close points
    pts.forEach((a,i) => pts.slice(i+1).forEach(b => {
      const d = Math.hypot(a.x-b.x, a.y-b.y);
      if (d < 100) {
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        ctx.strokeStyle = `rgba(0,212,255,${.04*(1-d/100)})`; ctx.lineWidth=.5; ctx.stroke();
      }
    }));
    requestAnimationFrame(draw);
  }
  draw();
})();

// ── Number count-up animation on KPI values ───────────────
document.querySelectorAll('.kpi-value[data-target]').forEach(el => {
  const target = parseInt(el.dataset.target);
  let current = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 40);
});

// ── Staggered row entrance ────────────────────────────────
const rows = document.querySelectorAll('tbody tr');
rows.forEach((row, i) => {
  row.style.opacity = '0';
  row.style.transform = 'translateX(-10px)';
  row.style.transition = `opacity .3s ease ${i*0.04}s, transform .3s ease ${i*0.04}s`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    row.style.opacity = '1'; row.style.transform = '';
  }));
});

// ── KPI card entrance stagger ─────────────────────────────
document.querySelectorAll('.kpi-card').forEach((card, i) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = `opacity .4s ease ${i*0.1}s, transform .4s cubic-bezier(.34,1.56,.64,1) ${i*0.1}s`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    card.style.opacity = '1'; card.style.transform = '';
  }));
});
</script>
<?php if (isset($extraScript)) echo $extraScript; ?>
</body>
</html>
