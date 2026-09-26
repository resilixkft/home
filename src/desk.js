// ---------- Upstairs work corner: the desk alcove at the top of the stairs ----------
// Built from three photos: IKEA-style white desk and KALLAX, mesh office chair with a blue spine,
// monitor on an arm and the MacBook Pro (15", mid 2015) on an aluminium stand, both switched off.
const V3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
};
// uv rectangle in atlas pixels -> quad uvs (BL, BR, TR, TL)
function uvR(W, H, x0, y0, x1, y1) { return [[x0 / W, y1 / H], [x1 / W, y1 / H], [x1 / W, y0 / H], [x0 / W, y0 / H]]; }
// quad with explicit corners (BL, BR, TR, TL as seen from the side the normal points to)
function quad(B, mat, bl, br, tr, tl, o = {}) {
  let n = V3.norm(V3.cross(V3.sub(br, bl), V3.sub(tl, bl)));
  if (o.n && V3.dot(n, o.n) < 0) n = V3.mul(n, -1);
  B.poly(mat, [bl, br, tr, tl], n, o);
}
// planar facet with its true normal, flipped towards a hint direction
function facet(B, mat, pts, hint, o) {
  let n = V3.norm(V3.cross(V3.sub(pts[1], pts[0]), V3.sub(pts[pts.length - 1], pts[0])));
  if (V3.dot(n, hint) < 0) n = V3.mul(n, -1);
  B.poly(mat, pts, n, o);
}
// oriented box: centre c, unit axes ax, ay, az (same handedness as plan x, y, z), half sizes h
// o.f face materials, o.uv face uv quads, o.fc face colours
function obox(B, c, ax, ay, az, h, o = {}) {
  const P = (sx, sy, sz) => [0, 1, 2].map(i => c[i] + ax[i] * sx * h[0] + ay[i] * sy * h[1] + az[i] * sz * h[2]);
  const F = {
    yn: [P(1, -1, -1), P(-1, -1, -1), P(-1, -1, 1), P(1, -1, 1), V3.mul(ay, -1)],
    yp: [P(-1, 1, -1), P(1, 1, -1), P(1, 1, 1), P(-1, 1, 1), ay],
    xn: [P(-1, -1, -1), P(-1, 1, -1), P(-1, 1, 1), P(-1, -1, 1), V3.mul(ax, -1)],
    xp: [P(1, 1, -1), P(1, -1, -1), P(1, -1, 1), P(1, 1, 1), ax],
    zp: [P(1, -1, 1), P(-1, -1, 1), P(-1, 1, 1), P(1, 1, 1), az],
    zn: [P(-1, -1, -1), P(1, -1, -1), P(1, 1, -1), P(-1, 1, -1), V3.mul(az, -1)]
  };
  const f = o.f || {};
  for (const k in F) {
    const mat = k in f ? f[k] : o.mat; if (!mat) continue;
    const [bl, br, tr, tl, n] = F[k];
    const oo = { col: (o.fc && o.fc[k]) || o.col, ext: 0, fz: o.fz, cz: o.cz };
    if (o.uv && o.uv[k]) oo.uvs = o.uv[k];
    B.poly(mat, [bl, br, tr, tl], n, oo);
  }
}
// straight segment as a thin box between two points (width w across, thickness t), 'up' hint for orientation
function barP(B, p0, p1, w, t, o, up = [0, 0, 1]) {
  const az = V3.norm(V3.sub(p1, p0)); let ax = V3.cross(up, az);
  if (Math.hypot(...ax) < 1e-4) ax = [1, 0, 0]; ax = V3.norm(ax);
  const ay = V3.cross(az, ax);
  obox(B, V3.lerp(p0, p1, 0.5), ax, ay, az, [w / 2, t / 2, Math.hypot(...V3.sub(p1, p0)) / 2], o);
}
// vertical extrusion of a convex outline
function slabZ(B, pts, z0, z1, o) {
  B.poly(o.mat, pts.map(p => [p[0], p[1], z1]), [0, 0, 1], o);
  B.poly(o.mat, pts.map(p => [p[0], p[1], z0]), [0, 0, -1], o);
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length]; let n = [b[1] - a[1], -(b[0] - a[0]), 0];
    if ((a[0] - cx) * n[0] + (a[1] - cy) * n[1] < 0) n = [-n[0], -n[1], 0];
    B.poly(o.mat, [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]], V3.norm(n), o);
  }
}
// leaf card: attach point p, direction d (stem -> tip), rough normal n, length l, cell 0/1 (pothos)
function leafCard(B, p, d, n, l, cell, o) {
  d = V3.norm(d); let s = V3.cross(d, n); if (Math.hypot(...s) < 1e-4) s = V3.cross(d, [1, 0, 0]); s = V3.norm(s);
  const w = l * 0.86, u0 = cell / 3, u1 = u0 + 1 / 3;
  const tl = V3.add(p, V3.mul(s, w / 2)), tr = V3.sub(p, V3.mul(s, w / 2));
  // slight fold along the midrib: two triangles-worth via a quad with a lifted tip
  const bl = V3.add(tl, V3.mul(d, l)), br = V3.add(tr, V3.mul(d, l));
  B.poly('leaf', [bl, br, tr, tl], V3.norm(V3.cross(V3.sub(br, bl), V3.sub(tl, bl))), Object.assign({ uvs: [[u0, 1], [u1, 1], [u1, 0], [u0, 0]] }, o));
}
// Catmull-Rom sampling of a polyline
function crPath(pts, step) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const L = Math.hypot(...V3.sub(p2, p1)), n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function buildDeskCorner(B) {
  const U = LV.U, UC = LV.UC, AC = 5.00; // alcove ceiling
  const g0 = B.group; B.group = 'upper'; B.mirror = false; B.extF = 0;
  const IN = { ext: 0, fz: U, cz: UC }, AL = { ext: 0, fz: U, cz: AC };
  const R = rng(331);
  const white = '#f4f4f1', black = '#151517';
  const A = (x0, y0, x1, y1) => uvR(1024, 1024, x0, y0, x1, y1);

  // ---- the alcove itself: lowered ceiling with a lintel towards the landing ----
  { const g = B.group; B.group = 'roof'; B.ceil(6.75, 8.165, 19.96, 20.96, AC, 'ceiling', AL); B.group = g; }
  B.poly('plaster', [[6.75, 19.96, AC], [8.165, 19.96, AC], [8.165, 19.96, UC], [6.75, 19.96, UC]], [0, -1, 0], IN);
  // the front part of both side walls belongs to other wall blocks (no ceiling shading at the new ceiling height,
  // and internal seams); a plaster skin a few millimetres proud gives the alcove continuous side walls
  B.poly('plaster', [[8.162, 19.96, U], [8.162, 20.345, U], [8.162, 20.345, AC], [8.162, 19.96, AC]], [-1, 0, 0], AL);
  B.poly('plaster', [[6.753, 19.96, U], [6.753, 20.345, U], [6.753, 20.345, AC], [6.753, 19.96, AC]], [1, 0, 0], AL);
  // window: venetian blind pulled up, brass handle
  B.box(6.83, 7.27, 21.13, 21.16, 4.865, 4.93, Object.assign({ mat: 'paint', col: '#e4e4e0' }, AL));
  B.box(6.835, 7.265, 21.135, 21.155, 4.85, 4.865, Object.assign({ mat: 'paint', col: '#d8d8d4' }, AL));
  B.box(6.858, 6.863, 21.10, 21.105, 4.10, 4.85, Object.assign({ mat: 'paint', col: '#f2f2ee' }, AL));
  // (the window handle is on the tilting sash, see windowUnit)
  // radiator under the window and a double socket under the desk
  radiator(B, 'y', 20.96, -1, 6.86, 7.26, U + 0.14, U + 0.60);
  for (let k = 0; k < 7; k++) B.box(6.885 + k * 0.053, 6.889 + k * 0.053, 20.838, 20.84, U + 0.16, U + 0.58, Object.assign({ mat: 'paint', col: '#dcdcd8' }, AL));
  B.cylP([6.875, 20.90, U + 0.10], [6.875, 20.90, U + 0.14], 0.012, 8, { mat: 'metal', col: '#bdbdb8', ext: 0, caps: true });
  B.box(7.60, 7.74, 20.945, 20.96, U + 0.26, U + 0.33, Object.assign({ mat: 'paint', col: '#f3f3f0' }, AL));

  // ---- desk (white, 140 x 60, square legs) ----
  const DX0 = 6.76, DX1 = 8.16, DY0 = 20.33, DY1 = 20.93, DT = U + 0.74, DB = U + 0.705;
  B.box(DX0, DX1, DY0, DY1, DB, DT, Object.assign({ mat: 'paint', col: white }, AL));
  for (const x of [DX0 + 0.02, DX1 - 0.065]) for (const y of [DY0 + 0.02, DY1 - 0.065]) B.box(x, x + 0.045, y, y + 0.045, U, DB, Object.assign({ mat: 'paint', col: white }, AL));
  B.addCollider(DX0, DX1, DY0, DY1, U, DT);

  // ---- monitor on a single arm (screen off) ----
  const MX0 = 7.358, MX1 = 7.972, MY = 20.70, MZ0 = U + 0.97, MZ1 = U + 1.33;
  B.box(MX0, MX1, MY, MY + 0.016, MZ0, MZ1, Object.assign({ mat: 'paint', col: black }, AL));
  B.poly('deskGloss', [[MX0 + 0.008, MY - 0.0012, MZ0 + 0.022], [MX1 - 0.008, MY - 0.0012, MZ0 + 0.022], [MX1 - 0.008, MY - 0.0012, MZ1 - 0.008], [MX0 + 0.008, MY - 0.0012, MZ1 - 0.008]], [0, -1, 0],
    Object.assign({ uvs: [[512 / 1024, 944 / 1024], [0, 944 / 1024], [0, 652 / 1024], [512 / 1024, 652 / 1024]] }, AL));
  B.box(7.50, 7.83, MY + 0.016, MY + 0.05, MZ0 + 0.06, MZ1 - 0.07, Object.assign({ mat: 'paint', col: '#1b1c1f' }, AL));
  B.box(7.63, 7.70, MY + 0.05, MY + 0.068, U + 1.11, U + 1.18, Object.assign({ mat: 'paint', col: '#111' }, AL));
  B.cylZ(7.45, 20.885, DT, U + 1.17, 0.016, 10, { mat: 'metal', col: '#1a1a1c', ext: 0 });
  B.cylP([7.45, 20.885, U + 1.14], [7.665, 20.775, U + 1.145], 0.014, 8, { mat: 'metal', col: '#1a1a1c', ext: 0, caps: true });
  B.cylZ(7.45, 20.885, U + 1.12, U + 1.16, 0.022, 10, { mat: 'metal', col: '#232326', ext: 0 });
  B.box(7.42, 7.48, 20.855, 20.935, DT, DT + 0.018, Object.assign({ mat: 'paint', col: '#1a1a1c' }, AL));
  B.box(7.42, 7.48, 20.935, 20.955, U + 0.63, DT + 0.018, Object.assign({ mat: 'paint', col: '#1a1a1c' }, AL));
  B.box(7.42, 7.48, 20.87, 20.935, U + 0.63, U + 0.655, Object.assign({ mat: 'paint', col: '#1a1a1c' }, AL));

  // ---- keyboard + mouse ----
  obox(B, [7.71, 20.525, DT + 0.012], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.22, 0.066, 0.012],
    Object.assign({ mat: 'paint', col: '#141416', f: { zp: 'deskMatte' }, uv: { zp: A(0, 0, 1024, 300) }, fc: { zp: '#ffffff' } }, AL));
  B.sph(7.385, 20.53, DT + 0.002, 0.031, 0.055, 0.021, 14, Object.assign({ mat: 'gloss', col: '#141416' }, AL));

  // ---- MacBook Pro 15" (mid 2015) on an aluminium laptop stand ----
  {
    const a = 28 * Math.PI / 180, t = 14 * Math.PI / 180, th = 108 * Math.PI / 180;
    const W = [Math.cos(a), Math.sin(a), 0], D = [-Math.sin(a), Math.cos(a), 0], Z = [0, 0, 1];
    const D2 = V3.add(V3.mul(D, Math.cos(t)), V3.mul(Z, Math.sin(t))), Z2 = V3.add(V3.mul(D, -Math.sin(t)), V3.mul(Z, Math.cos(t)));
    const Lc = [7.10, 20.62, U + 0.945];
    const silver = '#c6c9cc', AO = Object.assign({ mat: 'metal', col: silver }, AL);
    // stand: base plate, two Z-shaped arms, tilted tray with front stops
    const pc = V3.add([Lc[0], Lc[1], DT + 0.004], V3.mul(D, -0.03));
    obox(B, pc, W, D, Z, [0.105, 0.11, 0.004], AO);
    for (const s of [-0.075, 0.075]) {
      const q0 = V3.add(V3.add(pc, V3.mul(W, s)), V3.mul(D, -0.085)), q1 = V3.add(V3.add([Lc[0], Lc[1], U + 0.865], V3.mul(W, s)), V3.mul(D, 0.075)), q2 = V3.add(V3.add([Lc[0], Lc[1], U + 0.93], V3.mul(W, s)), V3.mul(D, -0.01));
      barP(B, q0, q1, 0.018, 0.008, AO, W); barP(B, q1, q2, 0.018, 0.008, AO, W);
      B.cylP(V3.sub(q1, V3.mul(W, 0.012)), V3.add(q1, V3.mul(W, 0.012)), 0.009, 8, Object.assign({ caps: true }, AO));
    }
    const baseC = V3.add(Lc, V3.mul(Z2, 0.008));
    obox(B, V3.sub(baseC, V3.mul(Z2, 0.0115)), W, D2, Z2, [0.125, 0.115, 0.0035], AO);
    for (const s of [-0.09, 0.09]) obox(B, V3.add(V3.add(V3.add(baseC, V3.mul(W, s)), V3.mul(D2, -0.128)), V3.mul(Z2, -0.002)), W, D2, Z2, [0.012, 0.004, 0.012], AO);
    // laptop base: aluminium unibody, keyboard deck on top
    obox(B, baseC, W, D2, Z2, [0.1795, 0.1235, 0.008], Object.assign({}, AO, { f: { zp: 'deskMatte' }, uv: { zp: A(0, 300, 512, 652) }, fc: { zp: '#ffffff' } }));
    // lid, opened ~108 degrees, black glass screen (off) facing the chair
    const lidDir = V3.add(V3.mul(D2, -Math.cos(th)), V3.mul(Z2, Math.sin(th)));
    const sN = V3.add(V3.mul(D2, -Math.sin(th)), V3.mul(Z2, -Math.cos(th)));
    const hinge = V3.add(V3.add(baseC, V3.mul(D2, 0.1235)), V3.mul(Z2, 0.008));
    obox(B, V3.add(V3.add(hinge, V3.mul(lidDir, 0.1235)), V3.mul(sN, -0.003)), W, V3.mul(sN, -1), lidDir, [0.1795, 0.003, 0.1235],
      Object.assign({}, AO, { f: { yn: 'deskGloss' }, uv: { yn: A(512, 300, 1024, 652) }, fc: { yn: '#ffffff' } }));
    B.cylP(V3.add(hinge, V3.mul(W, -0.15)), V3.add(hinge, V3.mul(W, 0.15)), 0.005, 8, Object.assign({ caps: true }, AL, { mat: 'paint', col: '#1b1b1d' }));
    // charging cable from the left side of the laptop: droops to the desk and runs behind it
    const c0 = V3.add(V3.add(baseC, V3.mul(W, 0.182)), V3.mul(D2, 0.06));
    const cab = crPath([c0, V3.add(c0, [0.025, 0.02, -0.05]), [c0[0] + 0.04, c0[1] + 0.06, DT + 0.005], [7.33, 20.90, DT + 0.004], [7.335, 20.94, DT - 0.03], [7.34, 20.945, U + 0.36]], 0.03);
    for (let k = 0; k < cab.length - 1; k++) B.cylP(cab[k], cab[k + 1], 0.0028, 4, { mat: 'paint', col: '#eeeeea', ext: 0 });
  }

  // ---- mesh office chair with blue spine, tucked under the desk ----
  {
    const cx = 7.63, cy = 20.38, grey = '#dcdcd8', blue = '#2d55b8';
    const P = (dx, dy, z) => [cx + dx, cy + dy, U + z];
    // five-star base with casters
    B.cylZ(cx, cy, U + 0.095, U + 0.14, 0.045, 12, Object.assign({ mat: 'paint', col: '#d9d9d5' }, AL));
    for (let k = 0; k < 5; k++) {
      const ph = -1.35 + k * 2 * Math.PI / 5, d = [Math.cos(ph), Math.sin(ph), 0];
      barP(B, P(d[0] * 0.04, d[1] * 0.04, 0.125), P(d[0] * 0.30, d[1] * 0.30, 0.085), 0.045, 0.034, Object.assign({ mat: 'paint', col: '#e3e3df' }, AL), [0, 0, 1]);
      const wc = P(d[0] * 0.305, d[1] * 0.305, 0.03), side = [-d[1], d[0], 0];
      B.cylP(V3.add(wc, V3.mul(side, -0.016)), V3.add(wc, V3.mul(side, 0.016)), 0.03, 10, Object.assign({ mat: 'gloss', col: '#27366f', caps: true }, AL));
      B.box(wc[0] - 0.022, wc[0] + 0.022, wc[1] - 0.022, wc[1] + 0.022, U + 0.05, U + 0.085, Object.assign({ mat: 'paint', col: '#e6e6e2' }, AL));
    }
    B.cylZ(cx, cy, U + 0.14, U + 0.27, 0.034, 10, Object.assign({ mat: 'paint', col: '#b9b9b5' }, AL));
    B.cylZ(cx, cy, U + 0.27, U + 0.40, 0.022, 10, Object.assign({ mat: 'metal', col: '#9a9ea2' }, AL));
    B.box(cx - 0.09, cx + 0.09, cy - 0.10, cy + 0.10, U + 0.38, U + 0.43, Object.assign({ mat: 'paint', col: '#bdbdb9' }, AL));
    // seat
    const c = 0.06, sw = 0.245, s0 = -0.235, s1 = 0.235;
    slabZ(B, [[cx - sw, cy + s0], [cx + sw, cy + s0], [cx + sw, cy + s1 - c], [cx + sw - c, cy + s1], [cx - sw + c, cy + s1], [cx - sw, cy + s1 - c]], U + 0.43, U + 0.50, Object.assign({ mat: 'fabric', col: '#d9d9d5' }, AL));
    // armrests
    for (const s of [-1, 1]) {
      B.box(cx + s * 0.235 - 0.013, cx + s * 0.235 + 0.013, cy - 0.03, cy + 0.02, U + 0.40, U + 0.64, Object.assign({ mat: 'paint', col: '#cfcfcb' }, AL));
      B.box(cx + s * 0.16, cx + s * 0.235, cy - 0.03, cy + 0.02, U + 0.40, U + 0.425, Object.assign({ mat: 'paint', col: '#cfcfcb' }, AL));
      B.box(cx + s * 0.235 - 0.036, cx + s * 0.235 + 0.036, cy - 0.10, cy + 0.15, U + 0.64, U + 0.67, Object.assign({ mat: 'paint', col: '#d6d6d2' }, AL));
    }
    // backrest: curved mesh shell, reclined; mesh atlas region (512,652)-(768,908)
    const zs = [0.50, 0.60, 0.72, 0.86, 0.98, 1.07, 1.10], hw = [0.135, 0.148, 0.172, 0.198, 0.212, 0.206, 0.185];
    const NC = 6, yb = (z) => -0.235 - (z - 0.50) * 0.12;
    const pt = (i, j, off) => { const u = -1 + 2 * j / NC, z = zs[i]; const w = hw[i]; return P(u * w, yb(z) + 0.05 * u * u + off, z); };
    const mu = (j) => (512 + 256 * j / NC) / 1024, mv = (i) => (652 + 256 * (1 - (zs[i] - 0.50) / 0.60)) / 1024;
    for (let i = 0; i < zs.length - 1; i++) for (let j = 0; j < NC; j++) {
      // front (towards the seat, +y) and back (-y) faces
      const f = [pt(i, j, 0.011), pt(i, j + 1, 0.011), pt(i + 1, j + 1, 0.011), pt(i + 1, j, 0.011)];
      facet(B, 'deskMatte', f, [0, 1, 0], Object.assign({ uvs: [[mu(j), mv(i)], [mu(j + 1), mv(i)], [mu(j + 1), mv(i + 1)], [mu(j), mv(i + 1)]], col: '#f2f2ee' }, AL));
      const b = [pt(i, j + 1, -0.011), pt(i, j, -0.011), pt(i + 1, j, -0.011), pt(i + 1, j + 1, -0.011)];
      facet(B, 'deskMatte', b, [0, -1, 0], Object.assign({ uvs: [[mu(j + 1), mv(i)], [mu(j), mv(i)], [mu(j), mv(i + 1)], [mu(j + 1), mv(i + 1)]], col: '#f2f2ee' }, AL));
    }
    // rim around the shell
    const rimO = Object.assign({ mat: 'paint', col: '#d4d4d0' }, AL);
    for (let i = 0; i < zs.length - 1; i++) for (const j of [0, NC]) {
      const a0 = pt(i, j, 0.013), a1 = pt(i + 1, j, 0.013), b0 = pt(i, j, -0.013), b1 = pt(i + 1, j, -0.013);
      const out = j === 0 ? [-1, 0, 0] : [1, 0, 0];
      const e = V3.mul(out, 0.012);
      B.poly('paint', [V3.add(a0, e), V3.add(b0, e), V3.add(b1, e), V3.add(a1, e)], out, rimO);
      B.poly('paint', [a0, V3.add(a0, e), V3.add(a1, e), a1], [0, 1, 0], rimO);
      B.poly('paint', [b0, V3.add(b0, e), V3.add(b1, e), b1], [0, -1, 0], rimO);
    }
    for (let j = 0; j < NC; j++) for (const i of [0, zs.length - 1]) {
      const a0 = pt(i, j, 0.013), a1 = pt(i, j + 1, 0.013), b0 = pt(i, j, -0.013), b1 = pt(i, j + 1, -0.013);
      const up = i === 0 ? -1 : 1, e = [0, 0, 0.012 * up];
      B.poly('paint', [V3.add(a0, e), V3.add(a1, e), V3.add(b1, e), V3.add(b0, e)], [0, 0, up], rimO);
      B.poly('paint', [a0, a1, V3.add(a1, e), V3.add(a0, e)], [0, 1, 0], rimO);
      B.poly('paint', [b0, b1, V3.add(b1, e), V3.add(b0, e)], [0, -1, 0], rimO);
    }
    // blue spine from the seat mechanism up the back to the headrest
    const sp = [P(0, -0.10, 0.415), P(0, yb(0.52) - 0.03, 0.50), P(0, yb(0.70) - 0.024, 0.70), P(0, yb(0.90) - 0.024, 0.90), P(0, yb(1.10) - 0.024, 1.10), P(0, yb(1.16) - 0.02, 1.16)];
    for (let k = 0; k < sp.length - 1; k++) barP(B, sp[k], sp[k + 1], 0.052, 0.022, Object.assign({ mat: 'gloss', col: blue }, AL), [0, 1, 0]);
    // headrest: curved mesh pad in a grey frame on a short post
    barP(B, P(0, yb(1.10) - 0.012, 1.08), P(0, yb(1.18) - 0.005, 1.20), 0.036, 0.02, Object.assign({ mat: 'paint', col: '#cdcdc9' }, AL), [0, 1, 0]);
    const hz0 = 1.125, hz1 = 1.25, hh = 0.17, hy = (u) => yb(1.18) + 0.012 + 0.035 * u * u;
    for (let j = 0; j < 4; j++) {
      const u0 = -1 + j / 2, u1 = u0 + 0.5;
      const q = (u, z, off) => P(u * hh, hy(u) + off, z);
      facet(B, 'deskMatte', [q(u1, hz0, -0.008), q(u0, hz0, -0.008), q(u0, hz1, -0.008), q(u1, hz1, -0.008)], [0, -1, 0], Object.assign({ uvs: [[0.625 + u1 * 0.1, 0.86], [0.625 + u0 * 0.1, 0.86], [0.625 + u0 * 0.1, 0.66], [0.625 + u1 * 0.1, 0.66]], col: '#f2f2ee' }, AL));
      facet(B, 'deskMatte', [q(u0, hz0, 0.008), q(u1, hz0, 0.008), q(u1, hz1, 0.008), q(u0, hz1, 0.008)], [0, 1, 0], Object.assign({ uvs: [[0.625 + u0 * 0.1, 0.86], [0.625 + u1 * 0.1, 0.86], [0.625 + u1 * 0.1, 0.66], [0.625 + u0 * 0.1, 0.66]], col: '#f2f2ee' }, AL));
      for (const [z, n] of [[hz0, -1], [hz1, 1]]) {
        const za = z + n * 0.012;
        B.poly('paint', [q(u0, za, -0.01), q(u1, za, -0.01), q(u1, za, 0.01), q(u0, za, 0.01)], [0, 0, n], rimO);
        B.poly('paint', [q(u0, z, -0.01), q(u1, z, -0.01), q(u1, za, -0.01), q(u0, za, -0.01)], [0, -1, 0], rimO);
      }
    }
    for (const s of [-1, 1]) { const q = (z, off) => P(s * (hh + 0.012), hy(1) + off, z); B.poly('paint', [q(1.113, -0.01), q(1.113, 0.01), q(1.262, 0.01), q(1.262, -0.01)], [s, 0, 0], rimO);
      B.poly('paint', [P(s * hh, hy(1) - 0.01, 1.113), P(s * (hh + 0.012), hy(1) - 0.01, 1.113), P(s * (hh + 0.012), hy(1) - 0.01, 1.262), P(s * hh, hy(1) - 0.01, 1.262)], [0, -1, 0], rimO); }
    B.box(cx - 0.018, cx + 0.018, cy + hy(0) - 0.013, cy + hy(0) - 0.008, U + 1.125, U + 1.25, Object.assign({ mat: 'paint', col: '#d2d2ce' }, AL));
    B.addCollider(cx - 0.30, cx + 0.30, cy - 0.33, cy + 0.30, U, U + 1.25);
    B.seats.push({ kind: 'sit', x: cx, y: cy - 0.03, seatZ: U + 0.50, face: [0, 1], label: 'chair' });
  }

  // ---- wall shelf on the left wall: plants, a leaning print, clamp lamp ----
  const SZ = U + 1.462, SX0 = 7.965, SX1 = 8.165, SY0 = 19.985, SY1 = 20.895;
  B.box(SX0, SX1, SY0, SY1, SZ - 0.022, SZ, Object.assign({ mat: 'birch' }, AL));
  for (const y of [20.12, 20.74]) {
    B.box(SX1 - 0.012, SX1, y - 0.012, y + 0.012, SZ - 0.19, SZ - 0.022, Object.assign({ mat: 'metal', col: '#8f9396' }, AL));
    B.box(SX0 + 0.02, SX1 - 0.012, y - 0.012, y + 0.012, SZ - 0.034, SZ - 0.022, Object.assign({ mat: 'metal', col: '#8f9396' }, AL));
  }
  picture(B, 'x', SX1, -1, 20.20, 20.50, SZ, SZ + 0.40, 13, { mat: 'memo', frame: 0.02, depth: 0.02, mat0: 0.05, fcol: '#121212' });
  // terracotta pot with the pothos
  const pot = [8.045, 20.30];
  B.cone(pot[0], pot[1], SZ, SZ + 0.13, 0.062, 0.08, 14, Object.assign({ mat: 'paint', col: '#a2644e' }, AL));
  B.cylZ(pot[0], pot[1], SZ + 0.12, SZ + 0.145, 0.086, 14, Object.assign({ mat: 'paint', col: '#a86b54', caps: false }, AL));
  B.cylZ(pot[0], pot[1], SZ + 0.13, SZ + 0.134, 0.078, 12, Object.assign({ mat: 'paint', col: '#3a2a1f' }, AL));
  // white ribbed pot with the spider plant
  const sp = [8.06, 20.56], NR = 20, rr = (i) => (i % 2 ? 0.058 : 0.064);
  for (let i = 0; i < NR; i++) { const a0 = i / NR * 2 * Math.PI, a1 = (i + 1) / NR * 2 * Math.PI;
    const p0 = [sp[0] + Math.cos(a0) * rr(i), sp[1] + Math.sin(a0) * rr(i)], p1 = [sp[0] + Math.cos(a1) * rr(i + 1), sp[1] + Math.sin(a1) * rr(i + 1)], am = (a0 + a1) / 2;
    B.poly('paint', [[p0[0], p0[1], SZ], [p1[0], p1[1], SZ], [p1[0], p1[1], SZ + 0.125], [p0[0], p0[1], SZ + 0.125]], [Math.cos(am), Math.sin(am), 0], Object.assign({ col: '#f6f6f3' }, AL)); }
  B.cylZ(sp[0], sp[1], SZ + 0.11, SZ + 0.114, 0.056, 12, Object.assign({ mat: 'paint', col: '#3a2a1f' }, AL));
  // small black box on the shelf
  B.box(8.03, 8.09, 20.68, 20.76, SZ, SZ + 0.035, Object.assign({ mat: 'paint', col: '#1b1b1d' }, AL));
  // clamp lamp: black clamp on the shelf edge, gooseneck, small head aiming at the desk
  B.box(SX0 - 0.025, SX0 + 0.02, 20.80, 20.84, SZ - 0.07, SZ + 0.012, Object.assign({ mat: 'paint', col: '#18181a' }, AL));
  const neck = crPath([[SX0 - 0.012, 20.82, SZ + 0.01], [SX0 - 0.018, 20.82, SZ + 0.12], [SX0 - 0.04, 20.80, SZ + 0.19], [SX0 - 0.09, 20.78, SZ + 0.2], [SX0 - 0.125, 20.765, SZ + 0.16], [SX0 - 0.135, 20.76, SZ + 0.13]], 0.03);
  for (let k = 0; k < neck.length - 1; k++) B.cylP(neck[k], neck[k + 1], 0.0065, 6, Object.assign({ mat: 'gloss', col: '#141416' }, AL));
  B.cylP([SX0 - 0.135, 20.76, SZ + 0.135], [SX0 - 0.165, 20.735, SZ + 0.05], 0.019, 10, Object.assign({ mat: 'gloss', col: '#141416', caps: true }, AL));
  const cord = crPath([[SX0 - 0.01, 20.835, SZ - 0.07], [SX0 - 0.03, 20.86, U + 1.1], [SX0 - 0.06, 20.90, DT + 0.01]], 0.08);
  for (let k = 0; k < cord.length - 1; k++) B.cylP(cord[k], cord[k + 1], 0.003, 4, Object.assign({ mat: 'paint', col: '#141416' }, AL));

  // ---- plants: pothos cascading over the stair parapet, spider plant arching ----
  {
    const LO = Object.assign({}, AL);
    const stemO = Object.assign({ mat: 'paint', col: '#6f8d3a' }, AL);
    const soil = [pot[0], pot[1], SZ + 0.135];
    // bushy crown on the shelf
    for (let k = 0; k < 84; k++) {
      const ph = R() * Math.PI * 2, r = 0.02 + R() * 0.17, h = 0.01 + R() * 0.19 * (1 - r / 0.22);
      const p = [soil[0] + Math.cos(ph) * r * 0.8, soil[1] + Math.sin(ph) * r * (ph > Math.PI ? 1.4 : 0.9), soil[2] + h];
      if (p[0] > 8.135) p[0] = 8.135 - R() * 0.02;
      const out = V3.norm([Math.cos(ph), Math.sin(ph), 0]);
      const d = V3.norm(V3.add(V3.mul(out, 0.8 + R() * 0.3), [0, 0, -0.25 + R() * 0.7]));
      const n = V3.norm(V3.add([0, 0, 1], V3.mul(out, 0.6 + R() * 0.6)));
      leafCard(B, p, d, n, 0.065 + R() * 0.035, R() < 0.55 ? 0 : 1, LO);
    }
    // leaves spilling over the front edge of the shelf
    for (let k = 0; k < 34; k++) {
      const y = 20.02 + R() * 0.42, z = SZ - 0.07 + R() * 0.16, x = SX0 - 0.02 + R() * 0.07;
      const out = V3.norm([-1, (R() - 0.5) * 0.8, 0]);
      const d = V3.norm(V3.add(V3.mul(out, 0.5 + R() * 0.4), [0, (R() - 0.5) * 0.4, -0.5 - R() * 0.5]));
      const n = V3.norm(V3.add(out, [0, (R() - 0.5) * 0.6, 0.35]));
      leafCard(B, [x, y, z], d, n, 0.06 + R() * 0.035, R() < 0.5 ? 0 : 1, LO);
    }
    // trailing strands
    const strands = [
      [[8.04, 20.27, SZ + 0.15], [8.03, 20.08, SZ + 0.11], [8.05, 19.97, SZ + 0.02], [8.12, 19.93, U + 1.30], [8.20, 19.90, U + 1.075], [8.29, 19.86, U + 1.07], [8.33, 19.83, U + 0.92], [8.34, 19.80, U + 0.62]],
      [[8.02, 20.24, SZ + 0.14], [8.00, 20.03, SZ + 0.08], [8.02, 19.95, U + 1.36], [8.09, 19.93, U + 1.12], [8.135, 19.90, U + 0.95], [8.14, 19.88, U + 0.72]],
      [[8.03, 20.22, SZ + 0.12], [7.99, 20.06, SZ + 0.05], [7.975, 20.00, U + 1.30], [7.985, 19.985, U + 1.05], [7.99, 19.975, U + 0.88]],
      [[8.06, 20.25, SZ + 0.13], [8.12, 20.10, SZ + 0.08], [8.15, 19.99, U + 1.38], [8.22, 19.94, U + 1.08], [8.25, 19.70, U + 1.07], [8.26, 19.52, U + 1.07], [8.32, 19.45, U + 0.98], [8.33, 19.43, U + 0.80]],
      [[8.03, 20.33, SZ + 0.12], [8.00, 20.40, SZ + 0.02], [7.975, 20.43, U + 1.35], [7.972, 20.44, U + 1.18]],
      [[8.05, 20.34, SZ + 0.11], [8.07, 20.45, SZ + 0.03], [8.08, 20.52, SZ + 0.015]]
    ];
    for (const s of strands) {
      const path = crPath(s, 0.02);
      for (let k = 0; k < path.length - 1; k += 2) B.cylP(path[k], path[Math.min(k + 2, path.length - 1)], 0.0028, 3, stemO);
      let side = 1;
      for (let k = 2; k < path.length - 1; k += 2) {
        const p = path[k], tan = V3.norm(V3.sub(path[k + 1], path[k - 1]));
        let lat = V3.cross(tan, [0, 0, 1]); if (Math.hypot(...lat) < 0.2) lat = V3.cross(tan, [1, 0, 0]); lat = V3.norm(lat);
        const d = V3.norm(V3.add(V3.add(V3.mul(lat, side * (0.7 + R() * 0.3)), [0, 0, -0.55 - R() * 0.4]), V3.mul(tan, 0.3)));
        const n = V3.norm(V3.add(V3.mul(lat, -side * 0.3), [(R() - 0.5) * 0.8, (R() - 0.5) * 0.8 - 0.4, 0.5]));
        leafCard(B, V3.add(p, V3.mul(lat, side * 0.004)), d, n, 0.055 + R() * 0.035, R() < 0.6 ? 0 : 1, LO);
        side = -side;
      }
    }
    // spider plant: arching blades
    const base = [sp[0], sp[1], SZ + 0.115];
    for (let k = 0; k < 16; k++) {
      const ph = k / 16 * Math.PI * 2 + R() * 0.3, hd = [Math.cos(ph), Math.sin(ph), 0];
      const L = 0.22 + R() * 0.16, rise = 0.10 + R() * 0.2, wdt = 0.016;
      const ctrl = [base, V3.add(base, [hd[0] * L * 0.15, hd[1] * L * 0.15, rise * 0.8]), V3.add(base, [hd[0] * L * 0.55, hd[1] * L * 0.55, rise * 1.05]), V3.add(base, [hd[0] * L, hd[1] * L, rise * 0.55 - R() * 0.1])];
      if (ctrl[3][0] > SX1 - 0.005) ctrl[3][0] = SX1 - 0.005;
      const pts = crPath(ctrl, 0.05), strip = 512 / 768 + ((k % 4) / 4) * (256 / 768), sw = (256 / 768) / 4;
      for (let i = 0; i < pts.length - 1; i++) {
        const a0 = pts[i], a1 = pts[i + 1], tan = V3.norm(V3.sub(a1, a0));
        let lat = V3.norm(V3.cross(tan, [0, 0, 1])); if (!isFinite(lat[0])) lat = [1, 0, 0];
        const w0 = wdt * (1 - i / pts.length) + 0.004, w1 = wdt * (1 - (i + 1) / pts.length) + 0.002;
        const v0 = 1 - i / (pts.length - 1), v1 = 1 - (i + 1) / (pts.length - 1);
        B.poly('leaf', [V3.add(a0, V3.mul(lat, w0 / 2)), V3.sub(a0, V3.mul(lat, w0 / 2)), V3.sub(a1, V3.mul(lat, w1 / 2)), V3.add(a1, V3.mul(lat, w1 / 2))], V3.norm(V3.cross(tan, lat)),
          Object.assign({ uvs: [[strip, v0], [strip + sw, v0], [strip + sw, v1], [strip, v1]] }, LO));
      }
    }
  }

  // ---- framed documents and photos ----
  const FO = { mat: 'memo', frame: 0.017, depth: 0.022, mat0: 0.014, fcol: '#151515' };
  const cols = [[20.545, 20.765], [20.295, 20.515], [20.045, 20.265]], rows = [[1.665, 1.85], [1.455, 1.64], [1.245, 1.43]];
  const cells = [[3, 4, 5], [6, 7, 8], [9, 10, 11]];
  for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) picture(B, 'x', 6.75, 1, cols[q][0], cols[q][1], U + rows[r][0], U + rows[r][1], cells[r][q], FO);
  const prow = [[1.625, 1.795], [1.42, 1.59], [1.215, 1.385]];
  for (let r = 0; r < 3; r++) picture(B, 'y', 19.96, -1, 6.445, 6.665, U + prow[r][0], U + prow[r][1], r, FO);

  // ---- KALLAX 1x2 by the stair parapet: magazine file and folders on top, insert box below ----
  {
    const X0 = 7.40, X1 = 7.82, Y0 = 19.21, Y1 = 19.60, H = 0.77, t = 0.038, m = 0.016, kw = '#f3f3f0';
    const KO = Object.assign({ mat: 'paint', col: kw }, IN);
    B.box(X0, X0 + t, Y0, Y1, U, U + H, KO); B.box(X1 - t, X1, Y0, Y1, U, U + H, KO);
    B.box(X0 + t, X1 - t, Y0, Y1, U + H - t, U + H, KO); B.box(X0 + t, X1 - t, Y0, Y1, U, U + t, KO);
    const mz = U + (H - m) / 2; B.box(X0 + t, X1 - t, Y0, Y1, mz, mz + m, KO);
    // insert box with square holes
    obox(B, [(X0 + X1) / 2, (Y0 + Y1) / 2 + 0.004, (U + t + mz) / 2], [1, 0, 0], [0, 1, 0], [0, 0, 1], [(X1 - X0) / 2 - t - 0.002, (Y1 - Y0) / 2 - 0.008, (mz - U - t) / 2 - 0.002],
      Object.assign({}, KO, { f: { yn: 'deskMatte' }, uv: { yn: A(768, 652, 1024, 908) }, fc: { yn: '#ffffff' } }));
    // magazine file (angled cut to the front) and folders
    B.prismX([[Y0 + 0.03, mz + m], [Y1 - 0.02, mz + m], [Y1 - 0.02, mz + m + 0.30], [Y0 + 0.17, mz + m + 0.30], [Y0 + 0.03, mz + m + 0.13]], X0 + t + 0.006, X0 + t + 0.106, Object.assign({ mat: 'paint', col: '#f6f6f3' }, IN));
    B.box(X0 + t + 0.108, X0 + t + 0.122, Y0 + 0.05, Y1 - 0.04, mz + m, mz + m + 0.23, Object.assign({ mat: 'paint', col: '#f2c21b' }, IN));
    B.box(X0 + t + 0.122, X0 + t + 0.131, Y0 + 0.045, Y1 - 0.045, mz + m, mz + m + 0.245, Object.assign({ mat: 'paint', col: '#fafaf6' }, IN));
    B.addCollider(X0, X1, Y0, Y1, U, U + H);
  }
  B.group = g0;
}
