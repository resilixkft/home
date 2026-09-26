// ---------- Procedural textures (canvas) ----------
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbs(r, g, b, a = 1) { return `rgba(${r|0},${g|0},${b|0},${a})`; }
function jitter(c, amt, R) { const k = (R() - 0.5) * 2 * amt; return [c[0] * (1 + k), c[1] * (1 + k), c[2] * (1 + k)]; }
function noiseLayer(ctx, w, h, R, amt, scale = 1, alpha = 1) {
  const id = ctx.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * amt; d[i] += n; d[i+1] += n; d[i+2] += n; }
  ctx.putImageData(id, 0, 0);
}
function blotches(ctx, w, h, R, n, rmin, rmax, colFn) {
  for (let i = 0; i < n; i++) {
    const x = R() * w, y = R() * h, r = rmin + R() * (rmax - rmin);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); const c = colFn(R);
    g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { ctx.save(); ctx.translate(ox, oy); ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); }
  }
}

const TEX = {};
// each returns {c: canvas, u: meters per tile horizontally, v: meters per tile vertically}
TEX.brick = () => {
  const W = 1024, H = 1024, R = rng(11), c = cv(W, H), x = c.getContext('2d');
  // 4 bricks (0.26 m) across, 14 courses (0.075 m) down -> tile 1.04 x 1.05 m
  x.fillStyle = '#b9ada0'; x.fillRect(0, 0, W, H);
  noiseLayer(x, W, H, R, 26);
  const pal = ['#b8704f','#a9603f','#c47b58','#9c5a3c','#b3684a','#8f5236','#c6835f','#a5654a','#b57656','#98563a','#c07354'];
  const bw = W / 4, ch = H / 14, j = ch * 0.13;
  for (let r = 0; r < 14; r++) {
    const off = (r % 2) ? bw / 2 : 0;
    for (let i = -1; i < 5; i++) {
      const x0 = i * bw + off + j * 0.5, y0 = r * ch + j * 0.5, ww = bw - j, hh = ch - j;
      let col = jitter(hex(pal[(R() * pal.length) | 0]), 0.1, R);
      x.fillStyle = rgbs(...col); x.fillRect(x0, y0, ww, hh);
      // subtle face texture
      for (let k = 0; k < 40; k++) { const s = R(); x.fillStyle = rgbs(col[0]*(0.85+s*0.3), col[1]*(0.85+s*0.3), col[2]*(0.85+s*0.3), 0.35); x.fillRect(x0 + R()*ww, y0 + R()*hh, 2 + R()*9, 1 + R()*3); }
      const g = x.createLinearGradient(0, y0, 0, y0 + hh); g.addColorStop(0, 'rgba(255,255,255,0.07)'); g.addColorStop(1, 'rgba(0,0,0,0.12)');
      x.fillStyle = g; x.fillRect(x0, y0, ww, hh);
    }
  }
  noiseLayer(x, W, H, R, 14);
  return { c, u: 1.04, v: 1.05 };
};
// ---- living-room fireplace: klinker DF bricks (240 x 52 mm, 10 mm joints), 42 courses floor to ceiling ----
// front-face layout in metres from the left edge (u) and from the floor (z); every band sits on whole courses
const FIRE = { F: 1.10, H: 2.62, n: 42,
  open: [0.30, 0.80, 0, 0.3743],          // log recess, 6 courses
  lintel: [0.1525, 0.84, 0.3743, 0.4990], // soldier row over the log recess, 2 courses
  ins: [0.26, 0.84, 0.4990, 0.9357],      // insert, 7 courses
  band: [0.149, 0.951, 0.9357, 1.1229],   // soldier band over the insert, 3 courses
  grille: [0.33, 0.77, 1.6843, 1.9338] }; // warm-air grille, 4 courses
const FIRE_PAL = ['#735539', '#7a5a3d', '#6e5238', '#7f5f41', '#6a4e37', '#76583d', '#83623f', '#70553c', '#7b5b40', '#6c5039', '#86664a', '#745236', '#7d5d42'];
const FIRE_MORTAR = '#7a746b';
const FIRE_MEAN = [0, 1, 2].map(i => FIRE_PAL.reduce((a, c) => a + hex(c)[i], 0) / FIRE_PAL.length);
function klinker(x, R, px, py, w, h) {
  let col = jitter(hex(FIRE_PAL[(R() * FIRE_PAL.length) | 0]), 0.05, R);
  const gy = (col[0] + col[1] + col[2]) / 3; col = col.map(v => gy + (v - gy) * 0.85); // klinker reads a little greyer than its palette
  col = col.map((v, i) => FIRE_MEAN[i] + (v - FIRE_MEAN[i]) * 0.7);                   // and more even from brick to brick
  x.fillStyle = rgbs(...col); x.fillRect(px, py, w, h);
  // sanded klinker face: fine dark and light specks
  const n = (w * h / 10) | 0;
  for (let k = 0; k < n; k++) { const d = R() < 0.55; x.fillStyle = d ? rgbs(col[0] * 0.78, col[1] * 0.76, col[2] * 0.74, 0.4) : rgbs(Math.min(255, col[0] * 1.15), Math.min(255, col[1] * 1.17), Math.min(255, col[2] * 1.2), 0.35);
    x.fillRect(px + R() * w, py + R() * h, 1 + R() * 1.6, 1 + R() * 1.2); }
  // firing flash: one end a shade darker
  const g = x.createLinearGradient(px, 0, px + w, 0), e = R() < 0.5;
  g.addColorStop(0, e ? 'rgba(40,24,14,0.10)' : 'rgba(0,0,0,0)'); g.addColorStop(1, e ? 'rgba(0,0,0,0)' : 'rgba(40,24,14,0.10)');
  x.fillStyle = g; x.fillRect(px, py, w, h);
  x.fillStyle = 'rgba(255,238,215,0.07)'; x.fillRect(px, py, w, Math.max(1, h * 0.12));
  x.fillStyle = 'rgba(0,0,0,0.09)'; x.fillRect(px, py + h * 0.86, w, h * 0.14);
}
// the whole front face as one picture (1.10 x 2.62 m), bond cut around the insert, the soldier courses and the grille
TEX.fireFront = () => {
  const F = FIRE, S = 512, W = Math.round(F.F * S), H = Math.round(F.H * S), R = rng(1301), c = cv(W, H), x = c.getContext('2d');
  const hC = F.H / F.n, J = 0.010, Zc = (z) => (F.H - z) * S; // course height, joint, z -> canvas y
  x.fillStyle = FIRE_MORTAR; x.fillRect(0, 0, W, H); noiseLayer(x, W, H, R, 16);
  const brick = (u0, u1, z0, z1) => klinker(x, R, u0 * S, Zc(z1), (u1 - u0) * S, (z1 - z0) * S);
  const zones = [F.lintel, F.ins, F.band, F.grille, F.open];
  for (let k = 0; k < F.n; k++) {
    const z0 = k * hC, z1 = z0 + hC, zm = (z0 + z1) / 2;
    const cut = zones.filter(r => zm > r[2] && zm < r[3]).map(r => [r[0] - J, r[1] + J]);
    const off = (k % 2 ? 0.125 : 0) + (R() - 0.5) * 0.05;
    for (let u = off - 0.25; u < F.F; u += 0.25) {
      let segs = [[Math.max(0, u), Math.min(F.F, u + 0.24)]];
      for (const [a, b] of cut) segs = segs.flatMap(([p, q]) => (b <= p || a >= q) ? [[p, q]] : [[p, Math.min(q, a)], [Math.max(p, b), q]]);
      for (const [p, q] of segs) if (q - p > 0.025) brick(p, q, z0 + J, z1);
    }
  }
  // soldier courses: bricks standing upright, 52 mm faces with 10 mm joints
  for (const r of [F.band, F.lintel]) for (let u = r[0]; u + 0.05 <= r[1] + 1e-6; u += 0.0625) brick(u, u + 0.052, r[2] + J, r[3]);
  // behind the insert and the grille (covered by their own parts)
  x.fillStyle = '#141312';
  for (const r of [F.ins, F.grille]) x.fillRect(r[0] * S, Zc(r[3]), (r[1] - r[0]) * S, (r[3] - r[2]) * S);
  noiseLayer(x, W, H, R, 6);
  return { c, u: 1, v: 1, clamp: true };
};
// the same bricks as a repeating wall (1.0 m x 16 courses) for the sides of the column and inside the log recess
TEX.fireBrick = () => {
  const F = FIRE, S = 512, hC = F.H / F.n, W = S, H = Math.round(16 * hC * S), R = rng(1307), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = FIRE_MORTAR; x.fillRect(0, 0, W, H); noiseLayer(x, W, H, R, 16);
  for (let r = 0; r < 16; r++) {
    const y0 = r * hC * S, hh = (hC - 0.010) * S, off = (r % 2 ? 0.125 : 0) * S;
    for (let i = -1; i < 5; i++) { const x0 = i * 0.25 * S + off; klinker(x, R, x0, y0, 0.24 * S, hh); }
  }
  noiseLayer(x, W, H, R, 6);
  return { c, u: 1.0, v: 16 * hC };
};
TEX.woodClad = () => {
  const W = 512, H = 512, R = rng(7), c = cv(W, H), x = c.getContext('2d');
  const boards = 10, bh = H / boards;
  for (let b = 0; b < boards; b++) {
    const base = jitter([62, 48, 38], 0.14, R);
    x.fillStyle = rgbs(...base); x.fillRect(0, b * bh, W, bh);
    for (let k = 0; k < 70; k++) { const y = b * bh + R() * bh, s = 0.75 + R() * 0.5; x.strokeStyle = rgbs(base[0]*s, base[1]*s, base[2]*s, 0.5); x.lineWidth = 0.6 + R() * 1.6;
      x.beginPath(); x.moveTo(0, y); for (let xx = 0; xx <= W; xx += 32) x.lineTo(xx, y + Math.sin(xx * 0.02 + k) * 1.5); x.stroke(); }
    // weathered light streaks
    for (let k = 0; k < 8; k++) { x.fillStyle = 'rgba(160,140,120,0.08)'; x.fillRect(R() * W, b * bh + R() * bh, 40 + R() * 160, 2 + R() * 4); }
    const g = x.createLinearGradient(0, b * bh, 0, (b + 1) * bh); g.addColorStop(0, 'rgba(255,255,255,0.06)'); g.addColorStop(0.85, 'rgba(0,0,0,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
    x.fillStyle = g; x.fillRect(0, b * bh, W, bh);
    x.fillStyle = 'rgba(10,8,6,0.8)'; x.fillRect(0, (b + 1) * bh - 3, W, 3);
  }
  return { c, u: 2.0, v: 2.0 };
};
TEX.deck = () => {
  const W = 512, H = 512, R = rng(5), c = cv(W, H), x = c.getContext('2d');
  const n = 10, bw = W / n;
  x.fillStyle = '#2a211b'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < n; i++) {
    let y = -R() * H;
    while (y < H) {
      const len = H * (0.5 + R() * 0.6), base = jitter([112, 92, 74], 0.12, R);
      x.fillStyle = rgbs(...base); x.fillRect(i * bw + 2, y + 2, bw - 4, len - 4);
      for (let k = 0; k < 30; k++) { const xx = i * bw + 3 + R() * (bw - 6), s = 0.8 + R() * 0.4; x.fillStyle = rgbs(base[0]*s, base[1]*s, base[2]*s, 0.45); x.fillRect(xx, y + 2, 1 + R() * 2, len - 4); }
      y += len;
    }
  }
  noiseLayer(x, W, H, R, 18);
  return { c, u: 1.2, v: 1.2 };
};
TEX.floorGF = () => {
  const W = 512, H = 512, R = rng(21), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#35302c'; x.fillRect(0, 0, W, H);
  const n = 2, s = W / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const b = jitter([78, 68, 60], 0.06, R); x.fillStyle = rgbs(...b); x.fillRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3);
    blotches(x, W, H, R, 3, 30, 90, (R) => `rgba(${R()<0.5?95:60},${R()<0.5?84:52},${R()<0.5?74:45},0.18)`);
  }
  noiseLayer(x, W, H, R, 10);
  return { c, u: 0.9, v: 0.9 };
};
TEX.carpet = () => {
  const W = 256, H = 256, R = rng(3), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#6c776e'; x.fillRect(0, 0, W, H);
  for (let k = 0; k < 2600; k++) { const s = 0.8 + R() * 0.4; x.fillStyle = rgbs(108*s, 119*s, 110*s, 0.6); x.fillRect(R() * W, R() * H, 1 + R() * 6, 1); }
  noiseLayer(x, W, H, R, 16);
  return { c, u: 0.5, v: 0.5 };
};
TEX.roof = () => {
  const W = 512, H = 512, R = rng(9), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#26292c'; x.fillRect(0, 0, W, H);
  // diamond slates: grid rotated 45deg, 4 across tile
  const n = 4, s = W / n;
  for (let j = -1; j <= n * 2 + 1; j++) for (let i = -1; i <= n + 1; i++) {
    const cx = i * s + ((j % 2) ? s / 2 : 0), cy = j * s / 2;
    const b = jitter([50, 53, 56], 0.10, R);
    x.beginPath(); x.moveTo(cx, cy - s / 2 + 3); x.lineTo(cx + s / 2 - 3, cy); x.lineTo(cx, cy + s / 2 - 3); x.lineTo(cx - s / 2 + 3, cy); x.closePath();
    const g = x.createLinearGradient(cx, cy - s / 2, cx, cy + s / 2); g.addColorStop(0, rgbs(b[0]*1.15, b[1]*1.15, b[2]*1.15)); g.addColorStop(1, rgbs(b[0]*0.8, b[1]*0.8, b[2]*0.8));
    x.fillStyle = g; x.fill();
  }
  noiseLayer(x, W, H, R, 12);
  return { c, u: 0.8, v: 0.8 };
};
TEX.grass = () => {
  const W = 512, H = 512, R = rng(13), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#5b7a36'; x.fillRect(0, 0, W, H);
  blotches(x, W, H, R, 40, 20, 90, (R) => R() < 0.5 ? 'rgba(80,110,45,0.35)' : 'rgba(120,130,60,0.25)');
  for (let k = 0; k < 9000; k++) { const s = 0.7 + R() * 0.6; x.fillStyle = rgbs(90*s, 125*s, 55*s, 0.7); x.fillRect(R() * W, R() * H, 1, 2 + R() * 4); }
  noiseLayer(x, W, H, R, 14);
  return { c, u: 2.5, v: 2.5 };
};
TEX.pavers = () => {
  const W = 512, H = 512, R = rng(17), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#5a5855'; x.fillRect(0, 0, W, H);
  const cols = 4, rows = 8, pw = W / cols, ph = H / rows;
  for (let r = 0; r < rows; r++) for (let i = -1; i <= cols; i++) {
    const off = (r % 2) ? pw / 2 : 0, b = jitter([128, 126, 121], 0.07, R);
    x.fillStyle = rgbs(...b); x.fillRect(i * pw + off + 3, r * ph + 3, pw - 6, ph - 6);
  }
  noiseLayer(x, W, H, R, 22);
  return { c, u: 0.8, v: 0.8 };
};
TEX.gravel = () => {
  const W = 256, H = 256, R = rng(19), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#6d6a64'; x.fillRect(0, 0, W, H);
  for (let k = 0; k < 1400; k++) { const b = jitter([150, 146, 138], 0.25, R); x.fillStyle = rgbs(...b); x.beginPath(); x.ellipse(R() * W, R() * H, 2 + R() * 4, 2 + R() * 3, R() * 3, 0, 7); x.fill(); }
  return { c, u: 0.5, v: 0.5 };
};
TEX.zellige = () => {
  const W = 512, H = 512, R = rng(23), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#d8d6c8'; x.fillRect(0, 0, W, H);
  const n = 5, s = W / n, pal = ['#b7b572','#9fa865','#c3be7f','#8f9f60','#aeb56f','#c9c287','#98a45e','#b3ad69'];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const b = jitter(hex(pal[(R() * pal.length) | 0]), 0.08, R);
    const g = x.createRadialGradient(i*s + s*R(), j*s + s*R(), 2, i*s + s/2, j*s + s/2, s*0.8);
    g.addColorStop(0, rgbs(b[0]*1.12, b[1]*1.12, b[2]*1.1)); g.addColorStop(1, rgbs(b[0]*0.86, b[1]*0.86, b[2]*0.86));
    x.fillStyle = g; x.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
  }
  return { c, u: 0.5, v: 0.5 };
};
TEX.bathTile = () => {
  const W = 256, H = 512, R = rng(29), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#b9b7b2'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 1; i++) for (let j = 0; j < 2; j++) { const b = jitter([226, 224, 219], 0.02, R); x.fillStyle = rgbs(...b); x.fillRect(i * W + 2, j * H / 2 + 2, W - 4, H / 2 - 4); }
  noiseLayer(x, W, H, R, 6);
  return { c, u: 0.3, v: 0.6 };
};
TEX.bathFloor = () => {
  const W = 256, H = 256, R = rng(31), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#6a6863'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const b = jitter([140, 137, 130], 0.04, R); x.fillStyle = rgbs(...b); x.fillRect(i * W / 2 + 2, j * H / 2 + 2, W / 2 - 4, H / 2 - 4); }
  noiseLayer(x, W, H, R, 14);
  return { c, u: 0.6, v: 0.6 };
};
TEX.bTile = () => {
  const W = 256, H = 256, R = rng(37), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#4c4b48'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const b = jitter([118, 116, 110], 0.05, R); x.fillStyle = rgbs(...b); x.fillRect(i * W / 2 + 2, j * H / 2 + 2, W / 2 - 4, H / 2 - 4); }
  noiseLayer(x, W, H, R, 16);
  return { c, u: 0.6, v: 0.6 };
};
TEX.plaster = () => {
  const W = 256, H = 256, R = rng(41), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
  blotches(x, W, H, R, 16, 20, 70, () => 'rgba(0,0,0,0.018)');
  noiseLayer(x, W, H, R, 5);
  return { c, u: 1.5, v: 1.5 };
};
TEX.woodLight = () => {
  const W = 512, H = 128, R = rng(43), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#b9773b'; x.fillRect(0, 0, W, H);
  for (let k = 0; k < 120; k++) { const y = R() * H, s = 0.82 + R() * 0.3; x.strokeStyle = rgbs(185*s, 119*s, 59*s, 0.55); x.lineWidth = 0.5 + R() * 2;
    x.beginPath(); x.moveTo(0, y); for (let xx = 0; xx <= W; xx += 16) x.lineTo(xx, y + Math.sin(xx * 0.015 + k) * 3); x.stroke(); }
  noiseLayer(x, W, H, R, 8);
  return { c, u: 1.2, v: 0.3 };
};
TEX.woodDark = () => {
  const W = 512, H = 128, R = rng(47), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#4b2a1a'; x.fillRect(0, 0, W, H);
  for (let k = 0; k < 110; k++) { const y = R() * H, s = 0.75 + R() * 0.4; x.strokeStyle = rgbs(75*s, 42*s, 26*s, 0.6); x.lineWidth = 0.5 + R() * 2;
    x.beginPath(); x.moveTo(0, y); for (let xx = 0; xx <= W; xx += 16) x.lineTo(xx, y + Math.sin(xx * 0.012 + k) * 2); x.stroke(); }
  noiseLayer(x, W, H, R, 6);
  return { c, u: 1.2, v: 0.3 };
};
TEX.woodDarkV = () => {
  const s = TEX.woodDark(), c = cv(s.c.height, s.c.width), x = c.getContext('2d');
  x.translate(c.width / 2, c.height / 2); x.rotate(Math.PI / 2); x.drawImage(s.c, -s.c.width / 2, -s.c.height / 2);
  return { c, u: s.v, v: s.u };
};
TEX.woodWarmV = () => {
  const s = TEX.woodLight(), c = cv(s.c.height, s.c.width), x = c.getContext('2d');
  x.translate(c.width / 2, c.height / 2); x.rotate(Math.PI / 2); x.drawImage(s.c, -s.c.width / 2, -s.c.height / 2);
  return { c, u: s.v, v: s.u };
};
TEX.oak = () => {
  const W = 512, H = 128, R = rng(53), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#a57a4c'; x.fillRect(0, 0, W, H);
  for (let k = 0; k < 140; k++) { const y = R() * H, s = 0.8 + R() * 0.35; x.strokeStyle = rgbs(165*s, 122*s, 76*s, 0.5); x.lineWidth = 0.5 + R() * 1.8;
    x.beginPath(); x.moveTo(0, y); for (let xx = 0; xx <= W; xx += 16) x.lineTo(xx, y + Math.sin(xx * 0.02 + k * 0.7) * 2.5); x.stroke(); }
  noiseLayer(x, W, H, R, 8);
  return { c, u: 1.0, v: 0.25 };
};
TEX.asphalt = () => {
  const W = 256, H = 256, R = rng(59), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#48494b'; x.fillRect(0, 0, W, H); noiseLayer(x, W, H, R, 34);
  blotches(x, W, H, R, 10, 20, 60, () => 'rgba(20,20,20,0.12)');
  return { c, u: 3, v: 3 };
};
TEX.concrete = () => {
  const W = 256, H = 256, R = rng(61), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#a6a39c'; x.fillRect(0, 0, W, H); noiseLayer(x, W, H, R, 22);
  blotches(x, W, H, R, 14, 20, 70, () => 'rgba(60,55,50,0.07)');
  return { c, u: 2, v: 2 };
};
TEX.fabric = () => {
  const W = 128, H = 128, R = rng(67), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#e8e8e8'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < W; i += 2) { x.fillStyle = 'rgba(0,0,0,0.05)'; x.fillRect(i, 0, 1, H); x.fillRect(0, i, W, 1); }
  noiseLayer(x, W, H, R, 16);
  return { c, u: 0.25, v: 0.25 };
};
TEX.louver = () => {
  const W = 128, H = 256, R = rng(71), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#2a1a10'; x.fillRect(0, 0, W, H);
  const n = 16, s = H / n;
  for (let i = 0; i < n; i++) { const g = x.createLinearGradient(0, i * s, 0, i * s + s); g.addColorStop(0, '#6b4631'); g.addColorStop(0.7, '#553725'); g.addColorStop(1, '#23160e');
    x.fillStyle = g; x.fillRect(10, i * s + 1, W - 20, s - 2); }
  x.fillStyle = '#4e3222'; x.fillRect(0, 0, 10, H); x.fillRect(W - 10, 0, 10, H);
  return { c, u: 0.6, v: 0.65 };
};
TEX.curtain = () => {
  const W = 256, H = 64, R = rng(73), c = cv(W, H), x = c.getContext('2d');
  for (let i = 0; i < W; i++) { const a = 0.55 + 0.25 * Math.sin(i / W * Math.PI * 12) + (R() - 0.5) * 0.05; x.fillStyle = `rgba(248,248,244,${a})`; x.fillRect(i, 0, 1, H); }
  return { c, u: 1.0, v: 1.0 };
};
TEX.bamboo = () => {
  const W = 256, H = 256, R = rng(79), c = cv(W, H), x = c.getContext('2d');
  x.clearRect(0, 0, W, H);
  for (let y = 0; y < H; y += 5) { const b = jitter([196, 164, 116], 0.1, R); x.fillStyle = rgbs(b[0], b[1], b[2], 0.95); x.fillRect(0, y, W, 3); }
  x.fillStyle = 'rgba(90,70,45,0.95)'; for (const cx of [30, 128, 226]) x.fillRect(cx, 0, 2, H);
  return { c, u: 1.0, v: 1.0 };
};
TEX.foliage = () => {
  const W = 256, H = 256, R = rng(83), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#2f4a24'; x.fillRect(0, 0, W, H);
  for (let k = 0; k < 2600; k++) { const s = 0.6 + R() * 0.9; x.fillStyle = rgbs(58*s, 92*s, 40*s, 0.8); x.beginPath(); x.ellipse(R() * W, R() * H, 2 + R() * 4, 1 + R() * 2, R() * 3, 0, 7); x.fill(); }
  for (let k = 0; k < 500; k++) { x.fillStyle = 'rgba(20,30,15,0.5)'; x.fillRect(R() * W, R() * H, 2 + R() * 3, 2 + R() * 3); }
  return { c, u: 1.2, v: 1.2 };
};
TEX.grassPaver = () => {
  const W = 256, H = 256, R = rng(107), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#8f8c86'; x.fillRect(0, 0, W, H); noiseLayer(x, W, H, R, 20);
  const n = 4, s = W / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    x.fillStyle = rgbs(...jitter([88, 112, 52], 0.15, R)); x.beginPath(); x.ellipse(i * s + s / 2, j * s + s / 2, s * 0.3, s * 0.3, 0, 0, 7); x.fill();
    for (let k = 0; k < 40; k++) { x.fillStyle = 'rgba(120,150,70,0.6)'; x.fillRect(i * s + s * 0.25 + R() * s * 0.5, j * s + s * 0.25 + R() * s * 0.5, 1, 3); }
  }
  return { c, u: 0.6, v: 0.6 };
};
TEX.fence = () => {
  const W = 256, H = 128, c = cv(W, H), x = c.getContext('2d');
  x.clearRect(0, 0, W, H); x.fillStyle = '#2b2a28';
  for (let i = 0; i < 12; i++) x.fillRect(i * W / 12 + 6, 0, 5, H);
  x.fillRect(0, 6, W, 6); x.fillRect(0, H - 14, W, 6);
  return { c, u: 1.4, v: 1.25 };
};
// side boundary fence: rough-sawn boards, red-brown stain weathered patchy, grey-green lichen, splits and knots
TEX.fenceBoard = () => {
  const W = 256, H = 1024, R = rng(331), c = cv(W, H), x = c.getContext('2d');
  const wrap = (f) => { for (const o of [-W, 0, W]) { x.save(); x.translate(o, 0); f(); x.restore(); } };
  // soft patch stretched along the grain
  const patch = (px, py, r, sy, col) => wrap(() => { x.save(); x.translate(px, py); x.scale(1, sy);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(-r, -r, 2 * r, 2 * r); x.restore(); });
  x.fillStyle = '#7c4232'; x.fillRect(0, 0, W, H);
  // broad colour drift along the grain: redder, browner and sun-bleached streaks
  for (let k = 0; k < 26; k++) { const xx = R() * W, w = 6 + R() * 40, t = R();
    x.fillStyle = t < 0.4 ? 'rgba(150,66,44,0.30)' : t < 0.75 ? 'rgba(92,52,38,0.30)' : 'rgba(168,128,108,0.16)'; wrap(() => x.fillRect(xx, 0, w, H)); }
  // grain
  for (let k = 0; k < 170; k++) { const xx = R() * W, s = 0.68 + R() * 0.46, lw = 0.5 + R() * 1.6; x.strokeStyle = rgbs(126 * s, 64 * s, 46 * s, 0.45); x.lineWidth = lw;
    wrap(() => { x.beginPath(); x.moveTo(xx, 0); for (let y = 0; y <= H; y += 32) x.lineTo(xx + Math.sin(y * 0.011 + k) * 2.2, y); x.stroke(); }); }
  // saw marks across the grain
  for (let k = 0; k < 60; k++) { const xx = R() * W, y = R() * H; x.strokeStyle = 'rgba(200,158,136,0.12)'; x.lineWidth = 0.8 + R();
    wrap(() => { x.beginPath(); x.arc(xx, y + 90, 90, -Math.PI / 2 - 0.25, -Math.PI / 2 + 0.25); x.stroke(); }); }
  // weathering: grey-green lichen film in long patches, denser in places, with fine speckle inside
  for (let k = 0; k < 90; k++) { const cx = R() * W, cy = R() * H, spread = 20 + R() * 50, m = 3 + (R() * 6 | 0);
    for (let q = 0; q < m; q++) patch(cx + (R() - 0.5) * spread, cy + (R() - 0.5) * spread * 3, 5 + R() * 16, 2.2 + R() * 3,
      `rgba(${138 + R() * 30 | 0},${140 + R() * 24 | 0},${112 + R() * 20 | 0},${0.14 + R() * 0.24})`);
    for (let q = 0; q < 26; q++) { x.fillStyle = `rgba(${150 + R() * 30 | 0},${154 + R() * 26 | 0},${122 + R() * 20 | 0},${0.30 + R() * 0.3})`;
      const px = cx + (R() - 0.5) * spread * 1.2, py = cy + (R() - 0.5) * spread * 3.4; wrap(() => x.fillRect(px, py, 1 + R() * 2.2, 1 + R() * 2.6)); } }
  // splits
  for (let k = 0; k < 6; k++) { const xx = R() * W, y0 = R() * H, len = 90 + R() * 320; x.strokeStyle = 'rgba(40,20,14,0.55)'; x.lineWidth = 0.7 + R();
    wrap(() => { x.beginPath(); x.moveTo(xx, y0); for (let y = 0; y <= len; y += 24) x.lineTo(xx + Math.sin(y * 0.03 + k) * 1.5, y0 + y); x.stroke(); }); }
  // a couple of knots
  for (let k = 0; k < 2; k++) { const xx = R() * W, y = R() * H, rx = 2.5 + R() * 2.5, ry = 4 + R() * 5;
    wrap(() => { x.fillStyle = 'rgba(140,90,66,0.30)'; x.beginPath(); x.ellipse(xx, y, rx * 1.9, ry * 1.6, 0, 0, 7); x.fill();
      x.fillStyle = 'rgba(58,30,20,0.7)'; x.beginPath(); x.ellipse(xx, y, rx, ry, 0, 0, 7); x.fill(); }); }
  noiseLayer(x, W, H, R, 14);
  return { c, u: 0.48, v: 1.9 };
};
// side fence plinth: grey concrete blocks (0.40 x 0.20 m) in stretcher bond, grime and a little algae
TEX.plinthBlock = () => {
  const W = 512, H = 256, R = rng(337), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#7a766c'; x.fillRect(0, 0, W, H);
  const bw = W / 2, ch = H / 2, j = 3;
  for (let r = 0; r < 2; r++) { const off = r ? bw / 2 : 0;
    for (let i = -1; i < 3; i++) { x.fillStyle = rgbs(...jitter([168, 163, 150], 0.04, R)); x.fillRect(i * bw + off + j / 2, r * ch + j / 2, bw - j, ch - j); } }
  noiseLayer(x, W, H, R, 24);
  blotches(x, W, H, R, 28, 10, 50, (R) => `rgba(70,68,58,${0.05 + R() * 0.07})`);
  blotches(x, W, H, R, 14, 6, 24, (R) => `rgba(96,108,70,${0.06 + R() * 0.10})`);
  for (let k = 0; k < 900; k++) { x.fillStyle = R() < 0.5 ? 'rgba(60,58,52,0.35)' : 'rgba(215,212,204,0.25)'; x.fillRect(R() * W, R() * H, 1 + R() * 2, 1 + R() * 2); }
  return { c, u: 0.80, v: 0.40 };
};
TEX.grate = () => {
  const W = 128, H = 128, c = cv(W, H), x = c.getContext('2d');
  x.clearRect(0, 0, W, H); x.fillStyle = '#2d2e30';
  for (let i = 0; i < 8; i++) { x.fillRect(i * 16, 0, 5, H); x.fillRect(0, i * 16, W, 3); }
  return { c, u: 0.25, v: 0.25 };
};
TEX.garage = () => {
  const W = 256, H = 256, R = rng(109), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#e9e8e2'; x.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 32) { const g = x.createLinearGradient(0, y, 0, y + 32); g.addColorStop(0, '#f4f3ee'); g.addColorStop(0.5, '#e5e4de'); g.addColorStop(0.92, '#cfcec8'); g.addColorStop(1, '#9e9d98');
    x.fillStyle = g; x.fillRect(0, y, W, 32); x.fillStyle = 'rgba(0,0,0,0.06)'; x.fillRect(0, y + 15, W, 2); }
  noiseLayer(x, W, H, R, 6);
  return { c, u: 1.0, v: 0.52 };
};
TEX.mirror = () => {
  const W = 128, H = 256, c = cv(W, H), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W * 0.6, H); g.addColorStop(0, '#dfe4e6'); g.addColorStop(0.45, '#aeb5b8'); g.addColorStop(0.55, '#c9cfd2'); g.addColorStop(1, '#8e9699');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(255,255,255,0.18)'; x.beginPath(); x.moveTo(W * 0.15, 0); x.lineTo(W * 0.35, 0); x.lineTo(W * 0.05, H); x.lineTo(-W * 0.15, H); x.fill();
  return { c, u: 1.2, v: 2.0 };
};
TEX.plate = () => {
  const W = 256, H = 128, c = cv(W, H), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#d9b766'); g.addColorStop(0.5, '#b58f3f'); g.addColorStop(1, '#8e6d2c');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(60,40,10,0.6)'; x.lineWidth = 4; x.strokeRect(4, 4, W - 8, H - 8);
  x.fillStyle = '#2a1d0c'; x.font = 'bold 76px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('26/1', W / 2, H / 2 + 4);
  return { c, u: 1, v: 1, clamp: true };
};
TEX.white = () => { const c = cv(4, 4), x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 4, 4); return { c, u: 1, v: 1 }; };
TEX.rug = () => {
  const W = 256, H = 256, R = rng(89), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#d9d2c3'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(120,105,85,0.5)'; x.lineWidth = 3; x.strokeRect(14, 14, W - 28, H - 28); x.lineWidth = 1; x.strokeRect(24, 24, W - 48, H - 48);
  for (let k = 0; k < 3000; k++) { x.fillStyle = `rgba(0,0,0,${R() * 0.05})`; x.fillRect(R() * W, R() * H, 2, 1); }
  return { c, u: 1, v: 1, clamp: true };
};
// Photo / art atlas: 4x4 cells
TEX.art = () => {
  const W = 1024, H = 1024, R = rng(97), c = cv(W, H), x = c.getContext('2d'), s = W / 4;
  const palettes = [['#c9d6d8','#7ea2aa','#3d5a60','#e8d9b5'],['#f2c14e','#f78154','#4d9078','#b4436c'],['#d8d0c1','#8b7e6a','#3f3a33','#b9a37e'],['#9bc1bc','#5d576b','#ed6a5a','#f4f1bb'],
    ['#e6e1d6','#2b2d42','#8d99ae','#ef233c'],['#cad2c5','#84a98c','#52796f','#354f52'],['#fefae0','#dda15e','#bc6c25','#283618'],['#f1faee','#a8dadc','#457b9d','#1d3557']];
  for (let i = 0; i < 16; i++) {
    const cx = (i % 4) * s, cy = ((i / 4) | 0) * s, p = palettes[i % palettes.length], mono = i >= 8 && i < 12;
    x.save(); x.beginPath(); x.rect(cx, cy, s, s); x.clip();
    const bg = x.createLinearGradient(cx, cy, cx, cy + s); bg.addColorStop(0, mono ? '#cfcfcf' : p[0]); bg.addColorStop(1, mono ? '#6d6d6d' : p[1]);
    x.fillStyle = bg; x.fillRect(cx, cy, s, s);
    if (i % 3 === 0) { // landscape-like
      x.fillStyle = mono ? '#555' : p[2]; x.beginPath(); x.moveTo(cx, cy + s * 0.7); for (let k = 0; k <= 8; k++) x.lineTo(cx + k * s / 8, cy + s * (0.55 + R() * 0.2)); x.lineTo(cx + s, cy + s); x.lineTo(cx, cy + s); x.fill();
    } else if (i % 3 === 1) { // portrait-like
      x.fillStyle = mono ? '#3a3a3a' : p[2]; x.beginPath(); x.ellipse(cx + s * 0.5, cy + s * 0.42, s * 0.16, s * 0.2, 0, 0, 7); x.fill();
      x.beginPath(); x.ellipse(cx + s * 0.5, cy + s * 0.95, s * 0.34, s * 0.3, 0, 0, 7); x.fill();
    } else { // abstract
      for (let k = 0; k < 7; k++) { x.fillStyle = mono ? `rgba(40,40,40,${0.2 + R() * 0.5})` : p[(k % 3) + 1]; x.globalAlpha = 0.6 + R() * 0.4;
        x.fillRect(cx + R() * s * 0.8, cy + R() * s * 0.8, s * (0.1 + R() * 0.4), s * (0.1 + R() * 0.4)); }
      x.globalAlpha = 1;
    }
    blotches(x, W, H, R, 1, s * 0.2, s * 0.4, () => 'rgba(255,255,255,0.08)');
    x.restore();
  }
  return { c, u: 1, v: 1, clamp: true };
};
// game boxes spines for the corridor shelf
TEX.games = () => {
  const W = 512, H = 256, R = rng(101), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#f4f2ee'; x.fillRect(0, 0, W, H);
  const pal = ['#c0392b','#2e86c1','#f1c40f','#27ae60','#8e44ad','#e67e22','#16a085','#d35400','#2c3e50','#f39c12','#1abc9c','#e74c3c'];
  let y = 8;
  while (y < H - 10) { const h = 10 + R() * 22; let xx = 6; while (xx < W - 20) { const w = 60 + R() * 120; x.fillStyle = pal[(R() * pal.length) | 0]; x.fillRect(xx, y, Math.min(w, W - 6 - xx), h - 2);
      x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(xx + 6, y + h / 2 - 2, w * 0.4, 3); xx += w + 2; } y += h; }
  return { c, u: 1, v: 1, clamp: true };
};
TEX.books = () => {
  const W = 512, H = 128, R = rng(103), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#efefec'; x.fillRect(0, 0, W, H);
  let xx = 2; const pal = ['#7b3f3f','#2f4858','#c9a66b','#556b2f','#d9d4c7','#8c6d62','#3b3b58','#a44a3f','#e0c097'];
  while (xx < W - 4) { const w = 6 + R() * 14, h = H * (0.62 + R() * 0.33); x.fillStyle = pal[(R() * pal.length) | 0]; x.fillRect(xx, H - h, w, h); xx += w + 1; }
  return { c, u: 1, v: 1, clamp: true };
};
TEX.hob = () => {
  const W = 256, H = 256, c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#0d0d0f'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(200,200,200,0.35)'; x.lineWidth = 2;
  for (const [cx, cy, r] of [[70,70,44],[186,70,36],[70,186,36],[186,186,48]]) { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke(); }
  return { c, u: 1, v: 1, clamp: true };
};
TEX.oven = () => {
  const W = 256, H = 256, c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#9aa0a4'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#16181a'; x.fillRect(18, 60, W - 36, H - 78);
  x.fillStyle = '#26292c'; x.fillRect(18, 14, W - 36, 34);
  x.fillStyle = '#49e07a'; x.fillRect(W / 2 - 16, 24, 32, 12);
  x.fillStyle = '#c8cdd0'; x.fillRect(40, 70, W - 80, 8);
  return { c, u: 1, v: 1, clamp: true };
};

// ---------- Work corner (upstairs desk alcove) ----------
// atlas for the desk: keyboard, laptop deck + screen, monitor screen, chair mesh, KALLAX insert front
TEX.deskAtlas = () => {
  const W = 1024, H = 1024, R = rng(211), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#888'; x.fillRect(0, 0, W, H);
  const key = (kx, ky, kw, kh, base, top) => { x.fillStyle = base; x.fillRect(kx, ky, kw, kh); x.fillStyle = top; x.fillRect(kx + 2, ky + 2, kw - 4, kh - 5); };
  // external keyboard (0,0)-(1024,300): black, full size with numpad
  x.fillStyle = '#121214'; x.fillRect(0, 0, 1024, 300);
  { const u = 44, g = 5, y0 = 18, K = (kx, ky, kw, kh) => key(kx, ky, kw - g, kh - g, '#08080a', '#25262a');
    for (let i = 0; i < 13; i++) K(18 + i * 44 + (i > 0 ? 22 : 0) + (i > 4 ? 12 : 0) + (i > 8 ? 12 : 0), y0, 44, 34);
    const rows = [[0, 13, 2], [1.5, 12, 1.5], [1.8, 11, 2.2], [2.3, 10, 2.7]];
    for (let r = 0; r < 4; r++) { let xx = 18; const ky = y0 + 48 + r * 50; if (rows[r][0]) K(xx, ky, rows[r][0] * u, 50); xx += rows[r][0] * u;
      for (let i = 0; i < rows[r][1]; i++) { K(xx, ky, u, 50); xx += u; } K(xx, ky, rows[r][2] * u, 50); }
    { const ky = y0 + 48 + 4 * 50; let xx = 18; for (const w of [1.3, 1.2, 1.3, 6.4, 1.3, 1.2, 1.0, 1.3]) { K(xx, ky, w * u, 50); xx += w * u; } }
    for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) K(700 + i * 44, y0 + 48 + r * 50, 44, 50);
    K(744, y0 + 48 + 3 * 50, 44, 50); for (let i = 0; i < 3; i++) K(700 + i * 44, y0 + 48 + 4 * 50, 44, 50);
    for (let r = 0; r < 5; r++) for (let i = 0; i < 4; i++) {
      if (i === 3 && (r === 2 || r === 4)) continue;
      if (r === 4 && i === 1) continue;
      K(846 + i * 44, y0 + 48 + r * 50, r === 4 && i === 0 ? 88 : 44, i === 3 && (r === 1 || r === 3) ? 100 : 50); }
    x.fillStyle = '#6fe38a'; x.fillRect(900, 26, 6, 3); }
  // MacBook Pro deck (0,300)-(512,652): silver, black keys, big trackpad, speaker grilles
  { const X0 = 0, Y0 = 300, w = 512, h = 352;
    const g = x.createLinearGradient(0, Y0, 0, Y0 + h); g.addColorStop(0, '#c9cbcd'); g.addColorStop(1, '#bfc2c4'); x.fillStyle = g; x.fillRect(X0, Y0, w, h);
    const kx0 = 70, kw = 372, ky0 = Y0 + 20, u = kw / 14.5;
    x.fillStyle = '#9fa2a5'; x.fillRect(kx0 - 4, ky0 - 4, kw + 8, 6 * u * 0.92 + 8);
    for (let i = 0; i < 14; i++) key(kx0 + i * kw / 14, ky0, kw / 14 - 3, u * 0.5, '#0c0c0d', '#1c1c1e');
    for (let r = 0; r < 5; r++) { const ky = ky0 + u * 0.56 + r * u * 0.92; const n = [13, 13, 12, 11, 9][r];
      let xx = kx0; const lead = (kw - n * u) * (r === 4 ? 0.28 : 1);
      if (r < 4) { key(xx, ky, lead - 3, u * 0.86, '#0c0c0d', '#1c1c1e'); xx += lead; for (let i = 0; i < n; i++) { key(xx, ky, u - 3, u * 0.86, '#0c0c0d', '#1c1c1e'); xx += u; } }
      else { for (let i = 0; i < 4; i++) { key(xx, ky, u - 3, u * 0.86, '#0c0c0d', '#1c1c1e'); xx += u; } key(xx, ky, u * 5.2 - 3, u * 0.86, '#0c0c0d', '#1c1c1e'); xx += u * 5.2; for (let i = 0; i < 3; i++) { key(xx, ky, u - 3, u * 0.86, '#0c0c0d', '#1c1c1e'); xx += u; } } }
    for (const sx of [18, 454]) for (let r = 0; r < 26; r++) for (let q = 0; q < 6; q++) { x.fillStyle = '#6e7174'; x.fillRect(sx + q * 7, ky0 + r * 7, 3, 3); }
    const tx = 256 - 92, ty = Y0 + h - 150; x.fillStyle = '#c4c7c9'; x.fillRect(tx, ty, 184, 120); x.strokeStyle = '#a4a7aa'; x.lineWidth = 2; x.strokeRect(tx, ty, 184, 120);
    x.fillStyle = '#aeb1b3'; x.fillRect(236, Y0 + h - 8, 40, 8); }
  // MacBook Pro screen side (512,300)-(1024,652): black glass, screen off
  { const X0 = 512, Y0 = 300, w = 512, h = 352;
    x.fillStyle = '#0a0a0b'; x.fillRect(X0, Y0, w, h);
    const g = x.createLinearGradient(X0, Y0, X0 + w, Y0 + h); g.addColorStop(0, '#1a1d21'); g.addColorStop(0.45, '#121417'); g.addColorStop(0.55, '#1c1f23'); g.addColorStop(1, '#0f1113');
    x.fillStyle = g; x.fillRect(X0 + 22, Y0 + 20, w - 44, h - 58);
    x.fillStyle = '#222'; x.beginPath(); x.arc(X0 + w / 2, Y0 + 10, 3, 0, 7); x.fill();
    x.fillStyle = '#b9bcbf'; x.fillRect(X0, Y0 + h - 12, w, 12); }
  // monitor screen, off (0,652)-(512,944)
  { const X0 = 0, Y0 = 652, w = 512, h = 292;
    const g = x.createLinearGradient(X0, Y0, X0 + w * 0.8, Y0 + h); g.addColorStop(0, '#1b1e22'); g.addColorStop(0.5, '#101215'); g.addColorStop(0.62, '#181b1f'); g.addColorStop(1, '#0c0d0f');
    x.fillStyle = g; x.fillRect(X0, Y0, w, h); }
  // chair mesh (512,652)-(768,908)
  { const X0 = 512, Y0 = 652, s = 256; x.fillStyle = '#e4e4e0'; x.fillRect(X0, Y0, s, s);
    for (let i = 0; i < s; i += 5) for (let j = 0; j < s; j += 5) { x.fillStyle = ((i + j) % 10) ? 'rgba(90,92,92,0.55)' : 'rgba(90,92,92,0.4)'; x.fillRect(X0 + i + 1, Y0 + j + 1, 3, 3); } }
  // KALLAX insert front with a 3x3 grid of square holes (768,652)-(1024,908)
  { const X0 = 768, Y0 = 652, s = 256; x.fillStyle = '#f1f1ee'; x.fillRect(X0, Y0, s, s);
    x.strokeStyle = 'rgba(0,0,0,0.10)'; x.lineWidth = 3; x.strokeRect(X0 + 2, Y0 + 2, s - 4, s - 4);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { x.fillStyle = '#2e2e2c'; x.fillRect(X0 + 98 + i * 26, Y0 + 92 + j * 30, 13, 13); } }
  // lamp head underside glow (0,944)-(64,1008)
  x.fillStyle = '#fff5dc'; x.fillRect(0, 944, 64, 64);
  noiseLayer(x, W, H, R, 3);
  return { c, u: 1, v: 1, clamp: true };
};
// frame contents: 4x4 cells of 256 px (documents, tickets, a child's drawing, photos)
TEX.memo = () => {
  const W = 1024, H = 1024, R = rng(223), c = cv(W, H), x = c.getContext('2d'), s = 256;
  const lines = (cx, cy, x0, y0, w, n, gap, col = 'rgba(40,40,40,0.55)', th = 3) => { x.fillStyle = col; for (let i = 0; i < n; i++) x.fillRect(cx + x0, cy + y0 + i * gap, w * (0.55 + R() * 0.45), th); };
  const person = (px, py, sc, body, skin = '#d9b49a') => { x.fillStyle = skin; x.beginPath(); x.ellipse(px, py, 11 * sc, 13 * sc, 0, 0, 7); x.fill(); x.fillStyle = body; x.beginPath(); x.ellipse(px, py + 42 * sc, 24 * sc, 28 * sc, 0, Math.PI, 0); x.fill(); x.fillRect(px - 24 * sc, py + 42 * sc, 48 * sc, 30 * sc); };
  for (let i = 0; i < 16; i++) {
    const cx = (i % 4) * s, cy = ((i / 4) | 0) * s;
    x.save(); x.beginPath(); x.rect(cx, cy, s, s); x.clip();
    x.fillStyle = '#f4f3ef'; x.fillRect(cx, cy, s, s);
    switch (i) {
      case 0: // grey envelope with a shipping label
        x.fillStyle = '#b9bbbd'; x.fillRect(cx + 10, cy + 20, s - 20, s - 40); x.fillStyle = '#f7f7f5'; x.fillRect(cx + 40, cy + 50, 110, 150);
        for (let k = 0; k < 18; k++) { x.fillStyle = '#222'; x.fillRect(cx + 50 + k * 5, cy + 60, (k % 3) + 1, 36); }
        lines(cx, cy, 50, 110, 90, 6, 14); x.strokeStyle = '#555'; x.lineWidth = 2; x.strokeRect(cx + 170, cy + 60, 50, 50); break;
      case 1: // colourful ticket pair
        for (const [ox, cols] of [[14, ['#2e3a8c', '#e04e39', '#f2c230', '#2a9d8f']], [132, ['#6c3483', '#f39c12', '#1abc9c', '#e74c3c']]]) {
          x.fillStyle = '#fbfaf5'; x.fillRect(cx + ox, cy + 40, 110, 176);
          for (let k = 0; k < 9; k++) { x.fillStyle = cols[k % 4]; x.fillRect(cx + ox + 6 + R() * 70, cy + 48 + R() * 60, 14 + R() * 30, 10 + R() * 30); }
          x.fillStyle = '#222'; x.fillRect(cx + ox + 20, cy + 140, 70, 7); lines(cx, cy, ox + 10, 160, 90, 3, 14); }
        break;
      case 2: // child's rainbow drawing
        { const ax = cx + s / 2, ay = cy + 175; const cols = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];
          for (let k = 0; k < 6; k++) { x.strokeStyle = cols[k]; x.lineWidth = 11; x.beginPath(); x.arc(ax, ay, 88 - k * 11, Math.PI, 0); x.stroke(); }
          x.fillStyle = 'rgba(255,255,255,0.85)'; x.beginPath(); x.ellipse(ax - 80, ay + 4, 28, 14, 0, 0, 7); x.ellipse(ax + 80, ay + 4, 28, 14, 0, 0, 7); x.fill(); }
        break;
      case 3: // strip of three portraits
        for (let k = 0; k < 3; k++) { const ox = cx + 16 + k * 76; const g = x.createLinearGradient(0, cy + 40, 0, cy + 216); g.addColorStop(0, ['#8aa1b1', '#a39174', '#7f8c6a'][k]); g.addColorStop(1, '#3d4046');
          x.fillStyle = g; x.fillRect(ox, cy + 40, 70, 176); person(ox + 35, cy + 105, 1.0, ['#2c3e50', '#6d4c41', '#37474f'][k]); }
        break;
      case 4: // certificate
        x.fillStyle = '#c0392b'; x.fillRect(cx + 150, cy + 40, 70, 8); x.fillStyle = '#2e4a8c'; x.fillRect(cx + 150, cy + 52, 70, 8);
        x.fillStyle = '#333'; x.fillRect(cx + 40, cy + 70, 110, 12); lines(cx, cy, 40, 100, 170, 6, 16); x.fillStyle = '#2e4a8c'; x.fillRect(cx + 40, cy + 200, 50, 20); break;
      case 5: // grey document with photo
        x.fillStyle = '#d9dadb'; x.fillRect(cx + 16, cy + 16, s - 32, s - 32); x.fillStyle = '#9aa3a8'; x.fillRect(cx + 150, cy + 40, 70, 90); lines(cx, cy, 36, 40, 100, 10, 17); break;
      case 6: // blue event badge
        x.fillStyle = '#1f4e9c'; x.fillRect(cx + 70, cy + 20, 116, 90); x.fillStyle = '#ffffff'; x.fillRect(cx + 82, cy + 50, 92, 12);
        x.fillStyle = '#fbfbf9'; x.fillRect(cx + 70, cy + 110, 116, 120); x.fillStyle = '#222'; x.fillRect(cx + 86, cy + 130, 84, 12); lines(cx, cy, 86, 156, 80, 3, 16); break;
      case 7: // landscape photo, sunset over water
        { const g = x.createLinearGradient(0, cy + 30, 0, cy + 226); g.addColorStop(0, '#f6c08b'); g.addColorStop(0.5, '#e39a6c'); g.addColorStop(0.55, '#5d7a93'); g.addColorStop(1, '#2d3e52');
          x.fillStyle = g; x.fillRect(cx + 16, cy + 30, s - 32, 196); x.fillStyle = '#fff1c9'; x.beginPath(); x.arc(cx + 150, cy + 120, 16, 0, 7); x.fill(); }
        break;
      case 8: // two people photo
        { const g = x.createLinearGradient(0, cy + 30, 0, cy + 226); g.addColorStop(0, '#d8cbb5'); g.addColorStop(1, '#8c7b66'); x.fillStyle = g; x.fillRect(cx + 16, cy + 30, s - 32, 196);
          person(cx + 100, cy + 100, 1.3, '#3b3f46'); person(cx + 165, cy + 125, 1.0, '#b03a2e'); }
        break;
      case 9: // name card
        x.fillStyle = '#333'; x.fillRect(cx + 60, cy + 70, 100, 14); x.fillStyle = '#c0392b'; x.fillRect(cx + 60, cy + 92, 60, 8); lines(cx, cy, 60, 120, 120, 5, 16); break;
      case 10: // newspaper clipping
        x.fillStyle = '#e9e4d6'; x.fillRect(cx + 20, cy + 16, s - 40, s - 32); x.fillStyle = '#222'; x.fillRect(cx + 36, cy + 30, 150, 14);
        x.fillStyle = '#8d8a82'; x.fillRect(cx + 36, cy + 56, 70, 90); for (let col = 0; col < 3; col++) lines(cx, cy, 116 + (col === 0 ? 0 : -80 + col * 62), col === 0 ? 56 : 156, 54, col === 0 ? 7 : 4, 12, 'rgba(40,40,40,0.6)', 2);
        break;
      case 11: // playing cards fanned
        for (let k = 0; k < 5; k++) { x.save(); x.translate(cx + 128, cy + 200); x.rotate(-0.5 + k * 0.25); x.fillStyle = '#ffffff'; x.strokeStyle = '#999'; x.lineWidth = 2; x.fillRect(-36, -150, 72, 104); x.strokeRect(-36, -150, 72, 104);
          x.fillStyle = k % 2 ? '#c0392b' : '#222'; x.beginPath(); x.arc(-8, -110, 9, 0, 7); x.arc(8, -110, 9, 0, 7); x.arc(0, -124, 9, 0, 7); x.fill(); x.restore(); }
        break;
      case 12: // printed page with a small logo
        x.fillStyle = '#1f6fb2'; x.fillRect(cx + 40, cy + 36, 30, 30); lines(cx, cy, 40, 84, 176, 8, 16); break;
      case 13: // lilac abstract print (leaning frame on the shelf)
        { const g = x.createLinearGradient(cx, cy, cx + s, cy + s); g.addColorStop(0, '#c9c3e3'); g.addColorStop(1, '#8f86b8'); x.fillStyle = g; x.fillRect(cx, cy, s, s);
          x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(cx + 60, cy + 40, 50, 180); x.fillStyle = 'rgba(70,60,120,0.35)'; x.fillRect(cx + 130, cy + 90, 70, 130); }
        break;
      case 14: // postcard
        { const g = x.createLinearGradient(0, cy + 30, 0, cy + 226); g.addColorStop(0, '#9ec9e8'); g.addColorStop(1, '#4f8a4b'); x.fillStyle = g; x.fillRect(cx + 16, cy + 30, s - 32, 196);
          x.fillStyle = '#ece6d4'; x.fillRect(cx + 70, cy + 110, 60, 80); x.fillStyle = '#b5523b'; x.beginPath(); x.moveTo(cx + 62, cy + 112); x.lineTo(cx + 100, cy + 80); x.lineTo(cx + 138, cy + 112); x.fill(); }
        break;
      default: lines(cx, cy, 40, 50, 170, 9, 18);
    }
    x.restore();
  }
  noiseLayer(x, W, H, R, 4);
  return { c, u: 1, v: 1, clamp: true };
};
// leaf cards (alpha tested): pothos light (0-255), pothos deeper green (256-511), spider plant blades (512-767)
TEX.leaves = () => {
  const W = 768, H = 256, R = rng(227), c = cv(W, H), x = c.getContext('2d');
  x.clearRect(0, 0, W, H);
  const heart = (ox, c0, c1, vein) => {
    const g = x.createLinearGradient(ox, 0, ox + 256, 256); g.addColorStop(0, c0); g.addColorStop(1, c1);
    x.fillStyle = g; x.beginPath();
    x.moveTo(ox + 128, 34);
    x.bezierCurveTo(ox + 70, -6, ox + 6, 40, ox + 22, 108); x.bezierCurveTo(ox + 36, 170, ox + 96, 206, ox + 128, 250);
    x.bezierCurveTo(ox + 160, 206, ox + 220, 170, ox + 234, 108); x.bezierCurveTo(ox + 250, 40, ox + 186, -6, ox + 128, 34); x.fill();
    x.strokeStyle = vein; x.lineWidth = 4; x.beginPath(); x.moveTo(ox + 128, 34); x.quadraticCurveTo(ox + 124, 140, ox + 128, 240); x.stroke();
    x.lineWidth = 2; for (let k = 0; k < 4; k++) { const yy = 70 + k * 38; x.beginPath(); x.moveTo(ox + 127, yy); x.quadraticCurveTo(ox + 90, yy + 6, ox + 60 + k * 8, yy + 30); x.moveTo(ox + 129, yy); x.quadraticCurveTo(ox + 166, yy + 6, ox + 196 - k * 8, yy + 30); x.stroke(); }
    x.fillStyle = 'rgba(255,255,255,0.10)'; x.beginPath(); x.ellipse(ox + 96, 90, 30, 50, -0.4, 0, 7); x.fill();
  };
  heart(0, '#a9cf4a', '#6f9f2c', 'rgba(215,235,150,0.7)');
  heart(256, '#7fae34', '#4b7a1f', 'rgba(190,220,120,0.55)');
  for (let k = 0; k < 4; k++) { const ox = 512 + k * 64;
    x.fillStyle = k % 2 ? '#5f9a35' : '#6aa63a'; x.beginPath(); x.moveTo(ox + 32, 2); x.quadraticCurveTo(ox + 58, 60, ox + 54, 256); x.lineTo(ox + 10, 256); x.quadraticCurveTo(ox + 6, 60, ox + 32, 2); x.fill();
    x.fillStyle = '#e6edc8'; x.beginPath(); x.moveTo(ox + 32, 20); x.quadraticCurveTo(ox + 40, 80, ox + 38, 256); x.lineTo(ox + 26, 256); x.quadraticCurveTo(ox + 24, 80, ox + 32, 20); x.fill(); }
  return { c, u: 1, v: 1, clamp: true };
};

// ---------- Rear bedroom ----------
// perforated metal lamp shade: fan / scale pattern letting the copper lining glow through
TEX.nymo = () => {
  const W = 128, H = 128, c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#1f1b19'; x.fillRect(0, 0, W, H);
  const fan = (cx, cy) => { for (let r = 6; r <= 22; r += 5.5) { x.strokeStyle = 'rgba(214,142,82,0.9)'; x.lineWidth = 2.4; x.setLineDash([4, 2.5]); x.beginPath(); x.arc(cx, cy, r, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); } x.setLineDash([]); };
  for (let j = -1; j < 5; j++) for (let i = -1; i < 4; i++) fan(i * 44 + (j % 2 ? 22 : 0) + 22, j * 26 + 30);
  return { c, u: 0.085, v: 0.085 };
};
// fitted cotton sheet with soft wrinkles
TEX.sheet = () => {
  const W = 512, H = 512, R = rng(241), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#f0e9d5'; x.fillRect(0, 0, W, H);
  x.lineCap = 'round';
  for (let k = 0; k < 42; k++) {
    const x0 = R() * W, y0 = R() * H, a = (R() - 0.5) * 0.9 + (k % 4 ? 0.3 : 1.8), L = 60 + R() * 170, bend = (R() - 0.5) * 70;
    const cx = x0 + Math.cos(a) * L * 0.5 - Math.sin(a) * bend, cy = y0 + Math.sin(a) * L * 0.5 + Math.cos(a) * bend, ex = x0 + Math.cos(a) * L, ey = y0 + Math.sin(a) * L;
    for (const [w, al] of [[30, 0.018], [16, 0.024], [8, 0.03]]) {
      x.strokeStyle = `rgba(150,128,88,${al})`; x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(cx, cy, ex, ey); x.stroke();
      x.strokeStyle = `rgba(255,255,250,${al * 1.4})`; x.lineWidth = w * 0.7; x.beginPath(); x.moveTo(x0 + 5, y0 - 5); x.quadraticCurveTo(cx + 5, cy - 5, ex + 5, ey - 5); x.stroke();
    }
  }
  noiseLayer(x, W, H, R, 4);
  return { c, u: 1.3, v: 1.3 };
};
// large sepia canvas print: misty lake with a small wooden jetty (original composition)
TEX.pierArt = () => {
  const W = 1024, H = 512, R = rng(251), c = cv(W, H), x = c.getContext('2d');
  const sky = x.createLinearGradient(0, 0, 0, H * 0.46); sky.addColorStop(0, '#d9cfbf'); sky.addColorStop(1, '#efe7d8');
  x.fillStyle = sky; x.fillRect(0, 0, W, H * 0.46);
  // distant hills and a dark wooded headland on the right
  x.fillStyle = 'rgba(150,135,118,0.55)'; x.beginPath(); x.moveTo(0, H * 0.44); for (let i = 0; i <= 16; i++) x.lineTo(i * W / 16, H * (0.38 + 0.05 * Math.sin(i * 0.9) + R() * 0.02)); x.lineTo(W, H * 0.46); x.lineTo(0, H * 0.46); x.fill();
  x.fillStyle = '#4a3f35'; x.beginPath(); x.moveTo(W * 0.62, H * 0.46); x.quadraticCurveTo(W * 0.78, H * 0.18, W, H * 0.12); x.lineTo(W, H * 0.47); x.fill();
  for (let k = 0; k < 160; k++) { x.fillStyle = `rgba(60,50,42,${0.3 + R() * 0.4})`; const px = W * (0.66 + R() * 0.34), py = H * (0.14 + R() * 0.3); if (py > H * (0.46 - (px / W - 0.62) * 0.9)) x.fillRect(px, py, 3 + R() * 6, 6 + R() * 12); }
  // water
  const wat = x.createLinearGradient(0, H * 0.46, 0, H); wat.addColorStop(0, '#e6dccb'); wat.addColorStop(1, '#8f8170');
  x.fillStyle = wat; x.fillRect(0, H * 0.46, W, H * 0.54);
  x.fillStyle = 'rgba(74,63,53,0.35)'; x.beginPath(); x.moveTo(W * 0.62, H * 0.46); x.quadraticCurveTo(W * 0.8, H * 0.62, W, H * 0.7); x.lineTo(W, H * 0.46); x.fill();
  for (let k = 0; k < 40; k++) { x.fillStyle = `rgba(255,250,240,${0.05 + R() * 0.08})`; x.fillRect(R() * W, H * (0.5 + R() * 0.45), 40 + R() * 160, 2); }
  // jetty from the bottom left towards the middle, planks and posts
  const P = (t, s) => [W * (0.10 + 0.34 * t) + s * (1 - t) * 90 + s * t * 14, H * (1.02 - 0.50 * t)];
  x.fillStyle = '#b8aa94'; x.beginPath(); x.moveTo(...P(0, -1)); x.lineTo(...P(1, -1)); x.lineTo(...P(1, 1)); x.lineTo(...P(0, 1)); x.fill();
  for (let i = 0; i <= 26; i++) { const t = i / 26; x.strokeStyle = 'rgba(80,68,55,0.6)'; x.lineWidth = 2 * (1 - t) + 0.6; x.beginPath(); x.moveTo(...P(t, -1)); x.lineTo(...P(t, 1)); x.stroke(); }
  for (let i = 0; i <= 7; i++) { const t = i / 7 * 0.95; for (const s of [-1.12, 1.12]) { const [px, py] = P(t, s), hgt = 70 * (1 - t) + 10, wd = 12 * (1 - t) + 3; x.fillStyle = '#3e342c'; x.fillRect(px - wd / 2, py - hgt, wd, hgt + 8 * (1 - t)); } }
  noiseLayer(x, W, H, R, 10);
  return { c, u: 1, v: 1, clamp: true };
};
// upstairs bathroom (from photo): cream glazed wall tiles 25 x 20 cm, light grout
TEX.ubTile = () => {
  const W = 256, H = 256, R = rng(71), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#f3f0ea'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const b = jitter([231, 219, 195], 0.018, R), x0 = i * W / 2 + 1.5, y0 = j * H / 2 + 1.5, w = W / 2 - 3, h = H / 2 - 3;
    const g = x.createLinearGradient(x0, y0, x0 + w, y0 + h);
    g.addColorStop(0, rgbs(b[0] * 1.015, b[1] * 1.015, b[2] * 1.015)); g.addColorStop(1, rgbs(b[0] * 0.985, b[1] * 0.985, b[2] * 0.985));
    x.fillStyle = g; x.fillRect(x0, y0, w, h);
  }
  noiseLayer(x, W, H, R, 4);
  return { c, u: 0.5, v: 0.4 };
};
// dark aubergine-brown floor tiles 20 x 20 cm with pale grout
TEX.ubFloor = () => {
  const W = 256, H = 256, R = rng(73), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#b3a89c'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const b = jitter([66, 50, 49], 0.05, R);
    x.fillStyle = rgbs(...b); x.fillRect(i * W / 2 + 2, j * H / 2 + 2, W / 2 - 4, H / 2 - 4);
  }
  blotches(x, W, H, R, 10, 10, 40, () => 'rgba(20,10,12,0.08)');
  noiseLayer(x, W, H, R, 7);
  return { c, u: 0.4, v: 0.4 };
};
// front bedroom built-in wardrobe: honey oak laminate with long vertical streaks (0.5 m x 1.0 m tile)
TEX.cabWood = () => {
  const W = 256, H = 512, R = rng(83), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#b48b5d'; x.fillRect(0, 0, W, H);
  for (let k = 0; k < 170; k++) {
    const x0 = R() * W, w = 0.6 + R() * (R() < 0.15 ? 9 : 3), dark = R() < 0.55, s = dark ? 0.80 + R() * 0.12 : 1.05 + R() * 0.10;
    const amp = 1 + R() * 4, ph = R() * 6.28, cyc = 1 + ((R() * 2) | 0);
    x.strokeStyle = rgbs(180 * s, 139 * s, 93 * s, 0.14 + R() * 0.24); x.lineWidth = w;
    for (const ox of [-W, 0, W]) {
      x.beginPath();
      for (let y = 0; y <= H; y += 16) { const xx = x0 + ox + amp * Math.sin(ph + y / H * 6.2832 * cyc); y ? x.lineTo(xx, y) : x.moveTo(xx, y); }
      x.stroke();
    }
  }
  noiseLayer(x, W, H, R, 5);
  return { c, u: 0.5, v: 1.0 };
};
// kids' crayon drawing (framed on the wall)
TEX.kidArt = () => {
  const W = 256, H = 192, R = rng(89), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, W, H);
  const cols = ['#e24a8d', '#f2a33a', '#3aa0e0', '#6cc04a', '#9b59d0', '#f25f3a', '#26b3a3', '#f7d23e'];
  for (let k = 0; k < 40; k++) {
    const cx = 20 + R() * (W - 40), cy = 18 + R() * (H - 36), r = 14 + R() * 34;
    x.strokeStyle = cols[k % cols.length]; x.lineWidth = 3 + R() * 4; x.globalAlpha = 0.8;
    x.beginPath();
    for (let t = 0; t < 26; t++) { const a = t * 0.9 + R() * 0.5, rr = r * (0.4 + R() * 0.6); const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 0.8; t ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke();
  }
  x.globalAlpha = 1;
  return { c, u: 1, v: 1 };
};
// bed-tent fabric: an original under-the-sea print. Left 3/4 = hanging side panel, right 1/4 = canopy
TEX.tentSea = () => {
  const W = 1024, H = 512, R = rng(97), c = cv(W, H), x = c.getContext('2d');
  // side panel background
  let g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#173f86'); g.addColorStop(0.45, '#1f5fa4'); g.addColorStop(0.78, '#2a8a9a'); g.addColorStop(1, '#58b39a');
  x.fillStyle = g; x.fillRect(0, 0, 768, H);
  // canopy background
  g = x.createLinearGradient(768, 0, 1024, 0);
  g.addColorStop(0, '#1d58a0'); g.addColorStop(0.5, '#153f84'); g.addColorStop(1, '#1d58a0');
  x.fillStyle = g; x.fillRect(768, 0, 256, H);
  const ell = (cx, cy, rx, ry, col, rot = 0) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, 6.2832); x.fill(); };
  // light rays
  x.globalAlpha = 0.07; x.fillStyle = '#ffffff';
  for (let k = 0; k < 5; k++) { const a = 60 + k * 150; x.beginPath(); x.moveTo(a, 0); x.lineTo(a + 60, 0); x.lineTo(a + 150, 330); x.lineTo(a + 70, 330); x.fill(); }
  x.globalAlpha = 1;
  // sea floor: sand, seaweed, coral, shells
  x.fillStyle = '#6cc0a0'; x.beginPath(); x.moveTo(0, 470); for (let px = 0; px <= 768; px += 32) x.lineTo(px, 462 + 8 * Math.sin(px / 60)); x.lineTo(768, H); x.lineTo(0, H); x.fill();
  for (let k = 0; k < 14; k++) {
    const bx = 20 + R() * 730, h = 60 + R() * 110; x.strokeStyle = R() < 0.5 ? '#2f8f4e' : '#57b04a'; x.lineWidth = 5 + R() * 4;
    x.beginPath(); x.moveTo(bx, 480); for (let t = 1; t <= 8; t++) x.lineTo(bx + 9 * Math.sin(t * 1.3 + k), 480 - h * t / 8); x.stroke();
  }
  const coral = (cx, base, s, col) => { x.strokeStyle = col; x.lineCap = 'round';
    const br = (px, py, a, l, d) => { if (d > 4) return; const ex = px + Math.cos(a) * l, ey = py + Math.sin(a) * l; x.lineWidth = 9 - d * 1.8; x.beginPath(); x.moveTo(px, py); x.lineTo(ex, ey); x.stroke(); br(ex, ey, a - 0.45, l * 0.72, d + 1); br(ex, ey, a + 0.4, l * 0.7, d + 1); };
    br(cx, base, -1.57, 34 * s, 0); };
  coral(250, 485, 1.2, '#f07a3a'); coral(560, 490, 1.0, '#f29aa6'); coral(700, 488, 0.8, '#f07a3a');
  x.fillStyle = '#8a4b2a'; x.fillRect(430, 440, 60, 38); x.fillStyle = '#b8323a'; x.fillRect(428, 428, 64, 16); x.fillStyle = '#f2c84a'; x.fillRect(455, 446, 10, 12);
  for (let k = 0; k < 6; k++) ell(90 + k * 120 + R() * 30, 486, 9, 6, '#f7e6d0');
  // big whale (lower right)
  ell(560, 350, 120, 48, '#4f77a6'); ell(560, 368, 104, 28, '#e8eef2');
  x.fillStyle = '#4f77a6'; x.beginPath(); x.moveTo(440, 345); x.lineTo(395, 318); x.lineTo(405, 352); x.lineTo(395, 382); x.fill();
  ell(640, 338, 5, 5, '#10213a');
  // small pale whale (upper left) and a second one
  ell(150, 110, 70, 22, '#dfe7ee', -0.15); x.fillStyle = '#dfe7ee'; x.beginPath(); x.moveTo(85, 122); x.lineTo(52, 100); x.lineTo(60, 135); x.fill();
  ell(290, 150, 46, 15, '#cdd9e4', -0.2);
  // octopus (upper middle)
  x.strokeStyle = '#f3b62c'; x.lineWidth = 9; x.lineCap = 'round';
  for (let k = 0; k < 8; k++) { const a0 = 0.35 + k * 0.33; x.beginPath(); let px = 470 + Math.cos(a0) * 30, py = 150 + Math.sin(a0) * 22; x.moveTo(px, py);
    for (let t = 1; t <= 10; t++) { const a = a0 + t * 0.22 * (k % 2 ? 1 : -1); px += Math.cos(a0) * 7 + Math.cos(a) * 3; py += 8 + Math.sin(a) * 3; x.lineTo(px, py); } x.stroke(); }
  ell(470, 118, 44, 50, '#f3b62c'); ell(455, 125, 7, 7, '#ffffff'); ell(486, 125, 7, 7, '#ffffff'); ell(455, 126, 3, 3, '#1b1b1b'); ell(486, 126, 3, 3, '#1b1b1b');
  // turtle
  ell(330, 300, 42, 30, '#c9b64a'); ell(330, 300, 32, 22, '#8f8a30'); ell(377, 292, 13, 10, '#c9b64a');
  for (const [dx, dy] of [[-30, -26], [22, -28], [-30, 26], [22, 28]]) ell(330 + dx, 300 + dy, 16, 7, '#c9b64a', dy > 0 ? 0.5 : -0.5);
  // stingray, jellyfish, fish schools, bubbles
  x.fillStyle = '#2a2f4a'; x.beginPath(); x.moveTo(640, 200); x.lineTo(700, 180); x.lineTo(655, 230); x.fill(); x.fillRect(640, 205, 30, 3);
  x.fillStyle = 'rgba(240,220,255,0.8)'; x.beginPath(); x.arc(200, 300, 16, 3.1416, 0); x.fill();
  x.strokeStyle = 'rgba(240,220,255,0.7)'; x.lineWidth = 2; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(190 + k * 7, 300); x.lineTo(186 + k * 7 + 4 * Math.sin(k), 330); x.stroke(); }
  const fish = (cx, cy, s, col) => { ell(cx, cy, 9 * s, 4 * s, col); x.fillStyle = col; x.beginPath(); x.moveTo(cx - 8 * s, cy); x.lineTo(cx - 14 * s, cy - 4 * s); x.lineTo(cx - 14 * s, cy + 4 * s); x.fill(); };
  for (let k = 0; k < 9; k++) fish(560 + (k % 3) * 22, 240 + ((k / 3) | 0) * 12, 0.8, '#76c7e8');
  for (let k = 0; k < 7; k++) fish(90 + (k % 4) * 20, 380 + ((k / 4) | 0) * 13, 0.7, '#f28b3c');
  for (let k = 0; k < 5; k++) fish(820 + R() * 170, 60 + R() * 390, 1.1, k % 2 ? '#f2d24a' : '#8fd3ef');
  ell(900, 260, 60, 20, '#d9e3ec', 0.1);
  x.strokeStyle = 'rgba(220,240,255,0.55)'; x.lineWidth = 1.5;
  for (let k = 0; k < 40; k++) { x.beginPath(); x.arc(R() * 1024, R() * 440, 2 + R() * 5, 0, 6.2832); x.stroke(); }
  return { c, u: 1, v: 1 };
};
