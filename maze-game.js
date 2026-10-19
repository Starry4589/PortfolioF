/* maze-game.js — first-person "Find your way to the arena" maze.
   Opens from the backstage STAGE sign (#bkDoor). Reach the green ARENA door in 60s -> VIP stage.
   Controls: ↑/W forward · ←/A and →/D turn 90° · ↓/S step back · Esc quits.
   Every action is one full animated step, so you can't skip or slide past a corridor. */
(function () {
 const COLS = 9, ROWS = 9, TIME = 60, W = 560, H = 350, FOV = 0.66;
 const V = [[1, 0], [0, 1], [-1, 0], [0, -1]];                 /* E, S, W, N */
 const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
 let ov, cv, cx, timerEl, cardEl, st = null, M = [], raf = 0, autoGo = 0, held = {}, pend = null;

 function build() {
  ov = document.createElement('div');
  ov.className = 'mz';
  ov.innerHTML = `
   <div class="mz-top">
    <div class="mz-title">FIND YOUR WAY TO THE ARENA</div>
    <div class="mz-timer" id="mzTimer">01:00</div>
    <button class="mz-quit" data-act="quit">✕ Quit</button>
   </div>
   <canvas id="mzCv" width="${W}" height="${H}"></canvas>
   <div class="mz-hint">↑ forward &nbsp;·&nbsp; ← → turn &nbsp;·&nbsp; ↓ step back &nbsp;·&nbsp; find the green door</div>
   <div class="mz-pad">
    <i></i><button data-d="up">▲</button><i></i>
    <button data-d="left">↺</button><button data-d="down">▼</button><button data-d="right">↻</button>
   </div>
   <div class="mz-card" id="mzCard"></div>`;
  document.body.appendChild(ov);
  cv = ov.querySelector('#mzCv'); cx = cv.getContext('2d');
  timerEl = ov.querySelector('#mzTimer'); cardEl = ov.querySelector('#mzCard');
  ov.addEventListener('click', e => {
   const a = e.target.closest('[data-act]'); if (a) ({ go: start, retry: open, quit: close, enter: enter })[a.dataset.act]();
  });
  ov.querySelectorAll('[data-d]').forEach(b => {
   const d = b.dataset.d;
   b.addEventListener('pointerdown', e => { e.preventDefault(); held[d] = 1; pend = d; });
   ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, () => held[d] = 0));
  });
  document.addEventListener('keydown', e => {
   if (!ov.classList.contains('show')) return;
   if (e.code === 'Escape') return close();
   const d = KEYMAP[e.code]; if (!d) return;
   e.preventDefault();
   if (!held[d]) { held[d] = 1; pend = d; }              /* a tap always registers once */
  });
  document.addEventListener('keyup', e => { const d = KEYMAP[e.code]; if (d) held[d] = 0; });
 }

 /* ---------- maze: carve rooms, then convert to a block map for the raycaster ---------- */
 function makeMap() {
  const g = Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => ({ x, y, seen: 0, e: 0, s: 0 })));
  const stack = [g[0][0]]; g[0][0].seen = 1;
  while (stack.length) {
   const c = stack[stack.length - 1];
   const opts = V.filter(([dx, dy]) => { const n = g[c.y + dy]?.[c.x + dx]; return n && !n.seen; });
   if (!opts.length) { stack.pop(); continue; }
   const [dx, dy] = opts[Math.random() * opts.length | 0], n = g[c.y + dy][c.x + dx];
   if (dx === 1) c.e = 1; else if (dx === -1) n.e = 1; else if (dy === 1) c.s = 1; else n.s = 1;
   n.seen = 1; stack.push(n);
  }
  for (let i = 0; i < COLS * ROWS * .1; i++) {            /* extra doorways -> loops, feels like rooms */
   const x = Math.random() * (COLS - 1) | 0, y = Math.random() * (ROWS - 1) | 0;
   if (Math.random() < .5) g[y][x].e = 1; else g[y][x].s = 1;
  }
  const m = Array.from({ length: 2 * ROWS + 1 }, () => Array(2 * COLS + 1).fill(1));
  for (const c of g.flat()) {
   m[2 * c.y + 1][2 * c.x + 1] = 0;
   if (c.e) m[2 * c.y + 1][2 * c.x + 2] = 0;
   if (c.s) m[2 * c.y + 2][2 * c.x + 1] = 0;
  }
  m[2 * ROWS - 1][2 * COLS] = 2;                          /* the arena door, east wall of the last room */
  return m;
 }

 /* ---------- flow ---------- */
 function open() {
  if (!ov) build();
  clearTimeout(autoGo); cancelAnimationFrame(raf); held = {}; pend = null;
  M = makeMap();
  let dir = 0; while (M[1 + V[dir][1]][1 + V[dir][0]] !== 0) dir++;   /* start facing an open corridor */
  st = { x: 0, y: 0, dir, px: 1.5, py: 1.5, a: dir * Math.PI / 2, anim: null, bob: 0, running: false, t0: 0 };
  document.body.classList.add('maze-on'); ov.classList.add('show');
  timerEl.textContent = '01:00'; timerEl.classList.remove('low');
  render(performance.now());
  card(`<h2>FIND YOUR WAY<br>TO THE ARENA</h2>
   <p>The concert starts in <b>1 minute</b>. You're lost backstage: walk the corridors, turn at the corners and find the <b style="color:#7dffb5">glowing green door</b> before the clock hits zero.</p>
   <button data-act="go">Let's go ➜</button><button class="alt" data-act="quit">Back to backstage</button>`);
 }
 function start() { cardEl.classList.remove('show'); st.running = true; st.t0 = performance.now(); raf = requestAnimationFrame(frame); }
 function close() { clearTimeout(autoGo); cancelAnimationFrame(raf); held = {}; pend = null; if (st) st.running = false; ov.classList.remove('show'); document.body.classList.remove('maze-on'); }
 function enter() { close(); if (window.setSeat) window.setSeat('vip'); }
 function win() {
  const left = Math.ceil(TIME - (performance.now() - st.t0) / 1000); st.running = false;
  card(`<h2>YOU MADE IT! 🎉</h2><p>${left}s to spare. The crowd is going wild…</p><button data-act="enter">Enter the arena ➜</button>`);
  autoGo = setTimeout(enter, 2600);
 }
 function lose() {
  st.running = false;
  card(`<h2>TOO LATE! 😭</h2><p>The concert started without you.</p><button data-act="retry">Try again</button><button class="alt" data-act="quit">Back to backstage</button>`);
 }
 const card = html => { cardEl.innerHTML = html; cardEl.classList.add('show'); };

 /* ---------- movement: one action = one finished animation ---------- */
 function anim(o) { st.anim = Object.assign({ x0: st.px, y0: st.py, a0: st.a, x1: st.px, y1: st.py, a1: st.a, t0: performance.now(), dur: 280 }, o); }
 function act(d) {
  const s = st;
  if (d === 'left' || d === 'right') { const t = d === 'left' ? -1 : 1; s.dir = (s.dir + t + 4) % 4; return anim({ a1: s.a + t * Math.PI / 2, dur: 240 }); }
  const back = d === 'down', [dx, dy] = V[back ? (s.dir + 2) % 4 : s.dir];
  const v = M[2 * s.y + 1 + dy][2 * s.x + 1 + dx];
  if (v === 0) { s.x += dx; s.y += dy; anim({ x1: 2 * s.x + 1.5, y1: 2 * s.y + 1.5, walk: 1 }); }
  else if (v === 2 && !back) anim({ x1: s.px + dx * .42, y1: s.py + dy * .42, dur: 320, walk: 1, done: win });
  else anim({ x1: s.px + dx * .12, y1: s.py + dy * .12, dur: 160, yoyo: 1 });   /* bump into a wall */
 }
 function frame(now) {
  if (!st.running) return;
  const left = Math.max(0, TIME - (now - st.t0) / 1000), sec = Math.ceil(left);
  timerEl.textContent = '00:' + String(sec).padStart(2, '0'); timerEl.classList.toggle('low', sec <= 10);
  const A = st.anim;
  if (A) {
   const p = Math.min(1, (now - A.t0) / A.dur), e = A.yoyo ? Math.sin(p * Math.PI) : p * p * (3 - 2 * p);
   st.px = A.x0 + (A.x1 - A.x0) * e; st.py = A.y0 + (A.y1 - A.y0) * e; st.a = A.a0 + (A.a1 - A.a0) * e;
   st.bob = A.walk ? Math.sin(p * Math.PI) : 0;
   if (p >= 1) { st.anim = null; st.bob = 0; if (A.yoyo) { st.px = A.x0; st.py = A.y0; } if (A.done) { render(now); return A.done(); } }
  } else {
   const d = pend || ['up', 'left', 'right', 'down'].find(k => held[k]); pend = null;
   if (d) act(d);
  }
  render(now);
  if (left <= 0) return lose();
  raf = requestAnimationFrame(frame);
 }

 /* ---------- first-person raycaster ---------- */
 function render(now) {
  const hex = (getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() || '#ff70a6').replace('#', '');
  const T = [0, 2, 4].map(i => parseInt(hex.substr(i, 2), 16));
  const hz = (H / 2 - st.bob * 4) | 0;
  let g = cx.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, '#05010c'); g.addColorStop(1, '#2a1050');
  cx.fillStyle = g; cx.fillRect(0, 0, W, hz);
  g = cx.createLinearGradient(0, hz, 0, H); g.addColorStop(0, '#2a1050'); g.addColorStop(1, '#05010c');
  cx.fillStyle = g; cx.fillRect(0, hz, W, H - hz);
  const dx = Math.cos(st.a), dy = Math.sin(st.a), plx = -dy * FOV, ply = dx * FOV;
  let label = null;
  for (let i = 0; i < W; i++) {
   const cam = 2 * i / W - 1, rx = (dx + plx * cam) || 1e-9, ry = (dy + ply * cam) || 1e-9;
   let mx = st.px | 0, my = st.py | 0, side = 0, hit = 0;
   const ddx = Math.abs(1 / rx), ddy = Math.abs(1 / ry);
   const sx = rx < 0 ? -1 : 1, sy = ry < 0 ? -1 : 1;
   let sdx = (rx < 0 ? st.px - mx : mx + 1 - st.px) * ddx, sdy = (ry < 0 ? st.py - my : my + 1 - st.py) * ddy;
   while (!hit) {
    if (sdx < sdy) { sdx += ddx; mx += sx; side = 0; } else { sdy += ddy; my += sy; side = 1; }
    hit = M[my]?.[mx] ?? 1;
   }
   const dist = Math.max(.05, side ? sdy - ddy : sdx - ddx), lh = H / dist, y0 = hz - lh / 2;
   const wx = side ? st.px + dist * rx : st.py + dist * ry, u = wx - Math.floor(wx);
   let sh = Math.max(.07, 1 / (1 + dist * .34)) * (side ? .72 : 1), c;
   if (hit === 2) { const pul = .8 + .2 * Math.sin(now / 180); sh = Math.max(.55, sh) * pul; c = [60, 255, 150]; if (Math.abs(i - W / 2) < 2) label = [y0, lh]; }
   else c = ((u * 3) | 0) % 2 ? [98, 46, 152] : [80, 36, 128];
   cx.fillStyle = `rgb(${c[0] * sh | 0},${c[1] * sh | 0},${c[2] * sh | 0})`; cx.fillRect(i, y0, 1, lh + 1);
   if (hit !== 2) {                                          /* neon trim + panel seams */
    cx.fillStyle = `rgba(${T[0]},${T[1]},${T[2]},${Math.min(1, sh * 1.6)})`;
    cx.fillRect(i, y0, 1, 2); cx.fillRect(i, y0 + lh - 2, 1, 2); cx.fillRect(i, hz - lh * .08, 1, 1);
    if (u < .04 || u > .96) { cx.globalAlpha = .35; cx.fillRect(i, y0, 1, lh); cx.globalAlpha = 1; }
   }
  }
  if (label) {                                               /* "ARENA ➜" sign on the door */
   const s = Math.max(10, Math.min(40, label[1] * .16));
   cx.font = `800 ${s}px Bebas Neue, Impact, sans-serif`; cx.textAlign = 'center'; cx.fillStyle = '#eafff4';
   cx.shadowColor = '#7dffb5'; cx.shadowBlur = 12; cx.fillText('ARENA ➜', W / 2, hz - label[1] * .18); cx.shadowBlur = 0;
  }
 }
 /* the STAGE sign now opens the maze instead of jumping straight to VIP */
 document.addEventListener('click', e => { if (e.target.closest('#bkDoor')) { e.stopPropagation(); e.preventDefault(); open(); } }, true);
})();
