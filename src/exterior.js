// ---------- Exterior shell (built twice: our half and the mirrored neighbour half) ----------
const LV = { B: -2.59, BC: -0.32, G: 0, GC: 2.62, KC: 2.40, U: 2.88, UC: 5.38, SOF: 2.45 };
const ROOF = { rz: 7.88, rx: 5.915, t: Math.tan(30 * Math.PI / 180), xs: 1.25, xr: 10.58, th: 0.20, y1: 20.50 };
const roofTop = (x) => ROOF.rz - Math.abs(x - ROOF.rx) * ROOF.t;
const ALC = { x0: 6.30, x1: 8.75, z0: 6.46, k: (6.46 - 5.10) / (8.75 - 6.30), th: 0.18, y0: 20.34, y1: 21.50 };
const alcTop = (x) => ALC.z0 - (x - ALC.x0) * ALC.k;
const WIN_UP = { zb: 3.63, zt: 4.93 };
const WIN_ALC = { zb: 3.74, zt: 4.93 }; // desk alcove window: sill sits above the desk top (photos)

// local helper to place a box in a wall's frame: axis 'x' => across is x, along is y
function bxA(B, axis, c0, c1, a0, a1, z0, z1, o) { if (axis === 'x') B.box(Math.min(c0, c1), Math.max(c0, c1), a0, a1, z0, z1, o); else B.box(a0, a1, Math.min(c0, c1), Math.max(c0, c1), z0, z1, o); }

// Window / glazed unit in a wall. fp: frame plane (across coordinate), out: -1/+1 direction to exterior,
// outer: exterior face coordinate, inner: interior face coordinate
function windowUnit(B, axis, fp, out, outer, inner, a, b, zb, zt, o = {}) {
  const fw = o.fw || 0.07, fd = 0.08, f0 = fp - fd / 2, f1 = fp + fd / 2, fm = o.frameMat || 'woodDark';
  const glass = B.mirror ? 'glassNb' : 'glass';
  const bottom = o.door ? 0.03 : fw;
  bxA(B, axis, f0, f1, a, a + fw, zb, zt, { mat: fm, ext: 1 });
  bxA(B, axis, f0, f1, b - fw, b, zb, zt, { mat: fm, ext: 1 });
  bxA(B, axis, f0, f1, a + fw, b - fw, zt - fw, zt, { mat: fm, ext: 1 });
  bxA(B, axis, f0, f1, a + fw, b - fw, zb, zb + bottom, { mat: fm, ext: 1 });
  for (const m of (o.mull || [])) bxA(B, axis, f0 - 0.005, f1 + 0.005, m - 0.045, m + 0.045, zb + bottom, zt - fw, { mat: fm, ext: 1 });
  for (const t of (o.transom || [])) bxA(B, axis, f0 - 0.005, f1 + 0.005, a + fw, b - fw, t - 0.04, t + 0.04, { mat: fm, ext: 1 });
  if (!o.noGlass && !o.door) { // glass stops foam darts (players are already held back by the sill wall)
    if (axis === 'x') B.addCollider(fp - 0.03, fp + 0.03, a, b, zb, zt, 'glass'); else B.addCollider(a, b, fp - 0.03, fp + 0.03, zb, zt, 'glass');
  }
  if (!o.noGlass && o.tilt && !B.mirror) {
    // tilt-and-turn sashes: frame + glass + handle per pane, tilting inwards about the bottom edge as one movable part
    const h0 = zb + bottom, h1 = zt - fw, sw = 0.05, panes = [];
    let s0 = a + fw; for (const m of (o.mull || [])) { panes.push([s0, m - 0.045]); s0 = m + 0.045; } panes.push([s0, b - fw]);
    const inner2 = inner, mid = (a + b) / 2;
    B.mover({ tilt: { axis, p: axis === 'x' ? [fp, h0] : [h0, fp], ang: axis === 'x' ? 0.19 * out : -0.19 * out }, label: 'window', verbs: ['Tilt', 'Close'],
      center: axis === 'x' ? [inner2, mid, (h0 + h1) / 2] : [mid, inner2, (h0 + h1) / 2], reach: 1.8, cone: 0.6 }, (D) => {
      const so = { mat: fm, ext: 1 };
      panes.forEach(([p0, p1], k) => {
        bxA(D, axis, fp - 0.03, fp + 0.03, p0, p0 + sw, h0, h1, so); bxA(D, axis, fp - 0.03, fp + 0.03, p1 - sw, p1, h0, h1, so);
        bxA(D, axis, fp - 0.03, fp + 0.03, p0 + sw, p1 - sw, h0, h0 + sw, so); bxA(D, axis, fp - 0.03, fp + 0.03, p0 + sw, p1 - sw, h1 - sw, h1, so);
        const g0 = p0 + sw, g1 = p1 - sw, q0 = h0 + sw, q1 = h1 - sw;
        if (axis === 'x') D.poly(glass, [[fp, g0, q0], [fp, g1, q0], [fp, g1, q1], [fp, g0, q1]], [out, 0, 0], { ext: 1 });
        else D.poly(glass, [[g0, fp, q0], [g1, fp, q0], [g1, fp, q1], [g0, fp, q1]], [0, out, 0], { ext: 1 });
        // handle on the room side at the edge away from the side hinges
        const ha = (k === panes.length - 1 && panes.length > 1) ? p0 + sw / 2 : p1 - sw / 2, hz = (h0 + h1) / 2, rs = fp - out * 0.03;
        const hb = { mat: 'metal', col: o.handleCol || '#d9d9d6', ext: 0 };
        bxA(D, axis, Math.min(rs, rs - out * 0.012), Math.max(rs, rs - out * 0.012), ha - 0.015, ha + 0.015, hz - 0.035, hz + 0.035, hb);
        bxA(D, axis, Math.min(rs - out * 0.012, rs - out * 0.03), Math.max(rs - out * 0.012, rs - out * 0.03), ha - 0.008, ha + 0.008, hz - 0.12, hz, hb);
      });
    });
  } else if (!o.noGlass) {
    const g0 = a + fw, g1 = b - fw, h0 = zb + bottom, h1 = zt - fw;
    if (axis === 'x') B.poly(glass, [[fp, g0, h0], [fp, g1, h0], [fp, g1, h1], [fp, g0, h1]], [out, 0, 0], { ext: 1 });
    else B.poly(glass, [[g0, fp, h0], [g1, fp, h0], [g1, fp, h1], [g0, fp, h1]], [0, out, 0], { ext: 1 });
  }
  if (!o.door && !o.noSill) {
    // exterior metal sill
    const s0 = outer + out * 0.05, s1 = f0 * (out < 0 ? 1 : 0) + f1 * (out > 0 ? 1 : 0);
    bxA(B, axis, out < 0 ? s0 : f1, out < 0 ? f0 : s0, a - 0.03, b + 0.03, zb - 0.04, zb + 0.005, { mat: 'zinc', col: '#8a8d90', ext: 1 });
    if (!B.mirror && o.inSill !== false) {
      const i0 = inner - out * 0.03;
      bxA(B, axis, out < 0 ? f1 : i0, out < 0 ? i0 : f0, a - 0.02, b + 0.02, zb - 0.03, zb + 0.005, { mat: o.inSillMat || 'paint', col: o.inSillCol || '#f1f0ec', ext: 0 });
    }
  }
}

// exterior shutters (open, flat against the wall)
function shutterLeaf(B, x, y0, y1, zb, zt) {
  const H = zt - zb, W = y1 - y0;
  B.box(x - 0.035, x, y0, y1, zb, zt, { mat: 'louver', ext: 1, f: { xp: null },
    uvf: { xn: [[0, 2 * 0.65], [0.6, 2 * 0.65], [0.6, 0], [0, 0]] } });
}

function railing(B, pts, z0, h, o = {}) { // pts: polyline in plan [x,y], vertical bars
  const col = o.col || '#2a2522', sp = o.sp || 0.11;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay), dx = (bx - ax) / L, dy = (by - ay) / L;
    const n = Math.max(1, Math.round(L / sp));
    // rails
    const x0 = Math.min(ax, bx) - 0.02, x1 = Math.max(ax, bx) + 0.02, y0 = Math.min(ay, by) - 0.02, y1 = Math.max(ay, by) + 0.02;
    B.box(x0, x1, y0, y1, z0 + h - 0.04, z0 + h, { mat: 'metal', col, ext: 1 });
    B.box(x0 + 0.005, x1 - 0.005, y0 + 0.005, y1 - 0.005, z0 + 0.08, z0 + 0.11, { mat: 'metal', col, ext: 1 });
    for (let k = 0; k <= n; k++) {
      const px = ax + dx * L * k / n, py = ay + dy * L * k / n, post = (k === 0 || k === n || (o.posts && k % o.posts === 0));
      const r = post ? 0.022 : 0.007;
      B.box(px - r, px + r, py - r, py + r, z0 + (post ? 0 : 0.11), z0 + h - 0.04, { mat: 'metal', col, ext: 1 });
    }
    B.addCollider(Math.min(ax, bx) - 0.04, Math.max(ax, bx) + 0.04, Math.min(ay, by) - 0.04, Math.max(ay, by) + 0.04, z0, z0 + h);
  }
}

function lampCeil(B, x, y, z, r = 0.14, ext = 0) {
  B.cylZ(x, y, z - 0.07, z, r, 12, { mat: 'emissive', col: '#fff4de', ext, bottom: true });
}

function buildExterior(B, nb) {
  B.mirror = nb; B.extF = 1; B.forceGroup = nb ? 'nb' : null;
  const so = nb; // skin only for the neighbour
  const ew = (axis, t0, t1, a, b, z0, z1, side, mat, open, extra = {}) =>
    B.wall(axis, t0, t1, a, b, z0, z1, Object.assign({ ext: side, extMat: mat, open, skinOnly: so }, extra));
  B.group = 'ground';
  // ---- Ground floor shell ----
  const gfIn = { fz: 0, cz: LV.GC, noTop: true };
  const stOpen = [{ a: 13.26, b: 14.26, zb: 0, zt: 2.37 }, { a: 14.26, b: 16.86, zb: 0.61, zt: 2.37 }];
  ew('x', 1.60, 1.98, 11.99, 12.61, -0.70, 2.88, 'n', 'brick', stOpen, gfIn);
  ew('x', 1.60, 1.98, 12.61, 17.86, -0.30, 2.88, 'n', 'brick', stOpen, gfIn);
  ew('x', 1.60, 1.98, 17.86, 18.19, -0.70, 2.88, 'n', 'brick', [], Object.assign({ endB: 'brick' }, gfIn));
  ew('y', 17.81, 18.19, 1.98, 2.67, -0.70, 2.88, 'p', 'brick', [], gfIn);
  ew('x', 2.67, 3.05, 18.06, 20.34, -0.70, 2.88, 'n', 'brick', [{ a: 18.19, b: 19.19, zb: 0, zt: 2.20 }], Object.assign({ endB: 'brick' }, gfIn));
  ew('y', 19.96, 20.34, 3.05, 4.03, -0.70, 2.88, 'p', 'brick', [], gfIn);
  ew('x', 4.03, 4.33, 20.34, 21.26, -0.70, 2.64, 'n', 'woodClad', [], Object.assign({ endB: 'woodClad' }, gfIn));
  if (!nb) B.box(4.03, 4.33, 19.96, 20.34, -0.70, 2.88, { mat: 'plaster', ext: 0, fz: 0, cz: LV.GC, collide: true });
  ew('y', 20.96, 21.26, 4.33, 6.34, -0.70, 2.64, 'p', 'woodClad', [{ a: 5.03, b: 5.63, zb: 1.36, zt: 2.11 }], gfIn);
  ew('y', 20.96, 21.34, 6.34, 8.165, -0.70, 2.88, 'p', 'brick', [{ a: 6.715, b: 7.315, zb: 1.36, zt: 2.11 }], Object.assign({ endA: 'brick' }, gfIn));
  ew('x', 8.165, 8.545, 20.34, 21.34, -0.70, 2.88, 'p', 'brick', [], Object.assign({ endB: 'brick' }, gfIn));
  // stair tower (full height shaft)
  ew('y', 19.96, 20.34, 8.165, 10.53, -2.80, 5.02, 'p', 'brick', [], { endA: 'plaster', endB: 'woodClad' });
  ew('x', 10.23, 10.53, 18.06, 19.96, -2.80, 5.02, 'p', 'woodClad', [{ a: 18.24, b: 18.82, zb: 2.48, zt: 4.88 }], {});
  ew('y', 17.68, 18.06, 8.86, 10.53, -2.80, 2.88, 'n', 'woodClad', [], { endB: 'woodClad', f: { zp: null } });
  ew('y', 17.82, 18.06, 10.23, 10.53, 2.88, 5.02, 'n', 'woodClad', [], { endB: 'woodClad' });
  if (!nb) B.box(8.48, 8.86, 17.68, 18.06, -2.80, 2.88, { mat: 'plaster', ext: 0, collide: true });
  // rear wall
  ew('x', 8.48, 8.86, 11.99, 17.68, -0.70, 2.88, 'p', 'brick',
    [{ a: 12.61, b: 14.21, zb: 0.61, zt: 2.37 }, { a: 14.21, b: 15.21, zb: 0, zt: 2.37 }, { a: 15.99, b: 17.19, zb: 1.07, zt: 2.13 }], gfIn);
  // ---- windows / glazed doors GF ----
  windowUnit(B, 'x', 1.72, -1, 1.60, 1.98, 14.26, 16.86, 0.61, 2.37, {}); // living room: one large fixed pane, not openable
  windowUnit(B, 'x', 1.72, -1, 1.60, 1.98, 13.26, 14.26, 0, 2.37, { door: true, noGlass: true });
  windowUnit(B, 'x', 8.74, 1, 8.86, 8.48, 12.61, 14.21, 0.61, 2.37, { tilt: true });
  windowUnit(B, 'x', 8.74, 1, 8.86, 8.48, 14.21, 15.21, 0, 2.37, { door: true, noGlass: true });
  windowUnit(B, 'x', 8.74, 1, 8.86, 8.48, 15.99, 17.19, 1.07, 2.13, { mull: [16.59], inSill: false, tilt: true });
  windowUnit(B, 'y', 21.14, 1, 21.26, 20.96, 5.03, 5.63, 1.36, 2.11, { tilt: true });
  windowUnit(B, 'y', 21.22, 1, 21.34, 20.96, 6.715, 7.315, 1.36, 2.11, { tilt: true });
  windowUnit(B, 'x', 2.79, -1, 2.67, 3.05, 18.19, 19.19, 0, 2.20, { door: true, noGlass: true });
  // stair window (tall, two panes)
  windowUnit(B, 'x', 10.41, 1, 10.53, 10.23, 18.24, 18.82, 2.48, 4.88, { transom: [3.95], inSillMat: 'woodDark', inSillCol: '#ffffff' });
  // neighbour: closed leaves for its doors
  if (nb) {
    B.box(1.70, 1.76, 13.30, 14.22, 0.03, 2.30, { mat: 'woodDark', ext: 1 });
    B.poly('glassNb', [[1.695, 13.40, 0.15], [1.695, 14.12, 0.15], [1.695, 14.12, 2.20], [1.695, 13.40, 2.20]], [-1, 0, 0], { ext: 1 });
    B.box(8.71, 8.77, 14.25, 15.17, 0.03, 2.30, { mat: 'woodDark', ext: 1 });
    B.poly('glassNb', [[8.775, 14.35, 0.15], [8.775, 15.07, 0.15], [8.775, 15.07, 2.20], [8.775, 14.35, 2.20]], [1, 0, 0], { ext: 1 });
    B.box(2.80, 2.86, 18.24, 19.14, 0.02, 2.14, { mat: 'woodDark', ext: 1, collide: true });
  }
  // porch & overhang soffits
  B.ceil(1.98, 2.67, 18.19, 19.96, LV.SOF, 'soffitP', { ext: 1 });
  B.box(8.86, 10.23, 11.99, 17.68, LV.SOF, 2.88, { mat: 'soffitP', ext: 1, f: { zp: null, xp: null, xn: null, yn: null } });
  lampCeil(B, 2.30, 19.10, LV.SOF, 0.12, 1);
  lampCeil(B, 9.55, 13.4, LV.SOF, 0.13, 1);
  lampCeil(B, 9.55, 16.3, LV.SOF, 0.13, 1);
  // wall lamp by the front door
  B.box(2.60, 2.67, 19.40, 19.52, 1.95, 2.15, { mat: 'metal', col: '#2b2b2b', ext: 1 });
  B.box(2.55, 2.60, 19.41, 19.51, 1.97, 2.12, { mat: 'emissive', col: '#ffefcc', ext: 1 });

  // ---- Upper floor shell ----
  B.group = 'upper';
  const ufIn = { fz: LV.U, cz: LV.UC };
  const wU = (a, b) => ({ a, b, zb: WIN_UP.zb, zt: WIN_UP.zt });
  ew('x', 1.60, 1.98, 11.99, 18.19, 2.88, 5.25, 'n', 'brick', [wU(13.27, 14.47), wU(15.67, 16.87)], Object.assign({ z1In: 5.40 }, ufIn));
  ew('x', 1.60, 1.98, 18.19, 20.34, LV.SOF, 5.25, 'n', 'brick', [wU(18.20, 18.80)], Object.assign({ endB: 'brick', z1In: 5.40 }, ufIn));
  ew('y', 19.96, 20.34, 1.98, 2.67, LV.SOF, 5.02, 'p', 'brick', [], Object.assign({ z1In: 5.40 }, ufIn));
  ew('y', 19.96, 20.34, 2.67, 5.26, 2.88, 5.02, 'p', 'brick', [], Object.assign({ z1In: 5.40 }, ufIn));
  if (!nb) B.box(5.26, 6.37, 19.96, 20.22, 5.00, 5.40, { mat: 'plaster', ext: 0 });
  // alcove (bay above the pantry)
  if (!nb) B.box(6.37, 6.75, 19.96, 20.22, 2.88, 5.38, { mat: 'plaster', ext: 0, fz: LV.U, cz: LV.UC, collide: true });
  B.box(6.37, 6.75, 20.22, 20.34, 2.84, 5.38, { mat: 'brick', ext: 1, collide: true, f: { xp: 'plaster', yn: null, yp: null }, fe: { xp: 0 }, fz: LV.U, cz: 5.00 });
  const alIn = { fz: LV.U, cz: 5.00 }; // alcove has a lowered ceiling
  ew('x', 6.37, 6.75, 20.34, 21.34, 2.84, 5.38, 'n', 'brick', [], Object.assign({ endB: 'brick' }, alIn));
  B.prismY([[6.37, 5.38], [6.75, 5.38], [6.75, alcTop(6.75) - 0.03], [6.37, alcTop(6.37) - 0.03]], 19.96, 21.34, { mat: 'brick', ext: 1, f: { yn: 'plaster', side: 'brick' }, fe: { yn: 0 } });
  ew('y', 20.96, 21.34, 6.75, 8.165, 2.88, 5.02, 'p', 'brick', [{ a: 6.75, b: 7.35, zb: WIN_ALC.zb, zt: WIN_ALC.zt }], alIn);
  B.prismY([[6.75, 5.02], [8.165, 5.02], [8.165, alcTop(8.165) - 0.03], [6.75, alcTop(6.75) - 0.03]], 20.96, 21.34, { mat: 'brick', ext: 1, f: { yn: 'plaster', side: 'plaster' }, fe: { yn: 0, side: 0 } });
  ew('x', 8.165, 8.545, 20.34, 21.34, 2.88, 5.10, 'p', 'brick', [], Object.assign({ endB: 'brick' }, alIn));
  // alcove roof
  {
    const x0 = ALC.x0, x1 = ALC.x1, y0 = ALC.y0, y1 = ALC.y1, t0 = alcTop(x0), t1 = alcTop(x1), th = ALC.th;
    const n = [ALC.k, 0, 1], l = Math.hypot(...n), N = n.map(v => v / l);
    B.poly('roof', [[x0, y0, t0], [x1, y0, t1], [x1, y1, t1], [x0, y1, t0]], N, { ext: 1 });
    B.poly('plaster', [[x0, y0, t0 - th], [x1, y0, t1 - th], [x1, y1, t1 - th], [x0, y1, t0 - th]], N.map(v => -v), { ext: 0, fz: LV.U, cz: LV.UC });
    B.poly('fascia', [[x0, y1, t0], [x1, y1, t1], [x1, y1, t1 - th - 0.02], [x0, y1, t0 - th - 0.02]], [0, 1, 0], { ext: 1 });
    B.poly('fascia', [[x1, y0, t1], [x1, y1, t1], [x1, y1, t1 - th - 0.02], [x1, y0, t1 - th - 0.02]], [1, 0, 0], { ext: 1 });
    B.poly('fascia', [[x0, y0, t0], [x0, y1, t0], [x0, y1, t0 - th], [x0, y0, t0 - th]], [-1, 0, 0], { ext: 1 });
    B.box(x1, x1 + 0.11, y0, y1, t1 - th - 0.12, t1 - th - 0.02, { mat: 'zinc', col: '#7c8084', ext: 1 });
    B.cylZ(x1 + 0.06, y1 - 0.08, -0.65, t1 - th - 0.1, 0.045, 8, { mat: 'zinc', col: '#7c8084', ext: 1 });
  }
  // balcony
  B.box(3.90, 6.37, 20.34, 21.42, 2.64, 2.84, { mat: 'concrete', ext: 1, f: { zp: null }, collide: false });
  B.floor(3.90, 6.37, 20.34, 21.42, 2.84, 'balconyTile', { ext: 1 });
  B.floor(5.26, 6.37, 19.96, 20.34, 2.88, 'carpet', { ext: 0 });
  railing(B, [[3.93, 20.34], [3.93, 21.39], [6.37, 21.39]], 2.84, 1.0, { col: '#55595c', sp: 0.12 });
  windowUnit(B, 'y', 20.22, 1, 20.34, 19.96, 5.26, 6.37, 2.88, 5.00, { door: true, noGlass: true, fw: 0.08 });
  if (nb) { B.box(5.34, 6.30, 20.19, 20.25, 2.90, 4.92, { mat: 'woodDark', ext: 1, collide: true });
    B.poly('glassNb', [[5.44, 20.26, 3.0], [6.20, 20.26, 3.0], [6.20, 20.26, 4.82], [5.44, 20.26, 4.82]], [0, 1, 0], { ext: 1 }); }
  // wall lamp + alarm box on the alcove west wall (seen from the balcony)
  B.box(6.30, 6.37, 20.95, 21.07, 4.15, 4.30, { mat: 'metal', col: '#1e1e1e', ext: 1 });
  B.box(6.33, 6.37, 20.55, 20.80, 4.55, 4.78, { mat: 'paint', col: '#e8e2c8', ext: 1 });
  // upper rear wall
  ew('x', 9.86, 10.23, 11.99, 17.82, LV.SOF, 5.25, 'p', 'brick', [wU(13.42, 15.22), wU(16.30, 16.90)], Object.assign({ z1In: 5.40 }, ufIn));
  // upper windows
  for (const [a, b] of [[13.27, 14.47], [15.67, 16.87], [18.20, 18.80]]) {
    // the front bedroom (13.27..14.47) and the small bedroom (15.67..16.87) windows are each one tilt-and-turn sash
    // with a brown inner sill (interior photos, owner's note)
    const one = !nb && (a === 13.27 || a === 15.67);
    windowUnit(B, 'x', 1.72, -1, 1.60, 1.98, a, b, WIN_UP.zb, WIN_UP.zt, one ? { inSillMat: 'woodDark', inSillCol: '#ffffff', tilt: true, handleCol: '#c9aa5a' } : { mull: b - a > 1 ? [(a + b) / 2] : [], tilt: true });
  }
  windowUnit(B, 'x', 10.11, 1, 10.23, 9.86, 13.42, 15.22, WIN_UP.zb, WIN_UP.zt, { mull: [14.32], inSillMat: 'woodDark', inSillCol: '#ffffff', tilt: true });
  windowUnit(B, 'x', 10.11, 1, 10.23, 9.86, 16.30, 16.90, WIN_UP.zb, WIN_UP.zt, { tilt: true });
  windowUnit(B, 'y', 21.22, 1, 21.34, 20.96, 6.75, 7.35, WIN_ALC.zb, WIN_ALC.zt, { inSillMat: 'woodDark', inSillCol: '#ffffff', tilt: true, handleCol: '#c9a24e' });
  // shutters on the street windows (open)
  shutterLeaf(B, 1.60, 12.67, 13.27, WIN_UP.zb, WIN_UP.zt); shutterLeaf(B, 1.60, 14.47, 15.07, WIN_UP.zb, WIN_UP.zt);
  shutterLeaf(B, 1.60, 15.07, 15.67, WIN_UP.zb, WIN_UP.zt); shutterLeaf(B, 1.60, 16.87, 17.47, WIN_UP.zb, WIN_UP.zt);
  shutterLeaf(B, 1.60, 18.80, 19.40, WIN_UP.zb, WIN_UP.zt);

  // ---- Roof ----
  B.group = 'roof';
  {
    const y0 = 11.988, y1 = ROOF.y1, xs = ROOF.xs, xr = ROOF.xr, rx = ROOF.rx, rz = ROOF.rz, th = ROOF.th;
    const zS = roofTop(xs), zR = roofTop(xr), s = Math.sin(Math.PI / 6), c = Math.cos(Math.PI / 6);
    B.poly('roof', [[xs, y0, zS], [rx, y0, rz], [rx, y1, rz], [xs, y1, zS]], [-s, 0, c], { ext: 1 });
    B.poly('roof', [[rx, y0, rz], [xr, y0, zR], [xr, y1, zR], [rx, y1, rz]], [s, 0, c], { ext: 1 });
    B.poly('soffit', [[xs, y0, zS - th], [rx, y0, rz - th], [rx, y1, rz - th], [xs, y1, zS - th]], [s, 0, -c], { ext: 1 });
    B.poly('soffit', [[rx, y0, rz - th], [xr, y0, zR - th], [xr, y1, zR - th], [rx, y1, rz - th]], [-s, 0, -c], { ext: 1 });
    // verge end faces
    B.poly('fascia', [[xs, y1, zS], [rx, y1, rz], [rx, y1, rz - th - 0.05], [xs, y1, zS - th - 0.05]], [0, 1, 0], { ext: 1 });
    B.poly('fascia', [[rx, y1, rz], [xr, y1, zR], [xr, y1, zR - th - 0.05], [rx, y1, rz - th - 0.05]], [0, 1, 0], { ext: 1 });
    // ridge cap
    B.box(rx - 0.09, rx + 0.09, y0, y1 + 0.02, rz - 0.04, rz + 0.06, { mat: 'zinc', col: '#3a3d40', ext: 1 });
    // eaves: fascia boards, boxed soffits, gutters
    B.box(xs - 0.03, xs, y0, y1, 4.98, zS + 0.01, { mat: 'fascia', ext: 1 });
    B.box(xr, xr + 0.03, y0, y1, 4.98, zR + 0.01, { mat: 'fascia', ext: 1 });
    B.box(xs, 1.60, y0, y1, 4.98, 5.02, { mat: 'soffit', ext: 1, f: { zp: null, xp: null } });
    B.box(10.23, xr, y0, 17.82, 4.98, 5.02, { mat: 'soffit', ext: 1, f: { zp: null, xn: null } });
    B.box(10.53, xr, 17.82, y1, 4.98, 5.02, { mat: 'soffit', ext: 1, f: { zp: null, xn: null } });
    B.box(xs - 0.15, xs - 0.03, y0, y1, 4.88, 4.99, { mat: 'zinc', col: '#7c8084', ext: 1 });
    B.box(xr + 0.03, xr + 0.15, y0, y1, 4.88, 4.99, { mat: 'zinc', col: '#7c8084', ext: 1 });
    // (vertical downpipes removed at the owner's request; the gutters stay)
    // gable wall (brick) above eaves level
    const zu = (x) => roofTop(x) - th + 0.02;
    B.prismY([[1.60, 5.02], [10.53, 5.02], [10.53, zu(10.53)], [rx, zu(rx)], [1.60, zu(1.60)]], 20.22, 20.34, { mat: 'brick', ext: 1, f: { yn: 'plaster', side: 'plaster' }, fe: { yn: 0, side: 0 } });
    if (!nb) B.prismY([[1.98, 5.40], [9.86, 5.40], [9.86, zu(9.86) - 0.02], [rx, zu(rx) - 0.02], [1.98, zu(1.98) - 0.02]], 19.96, 20.22, { mat: 'plaster', ext: 0 });
    // gable vent
    B.box(5.70, 6.10, 20.34, 20.37, 6.55, 6.80, { mat: 'metal', col: '#4a4a4a', ext: 1 });
    // roof hatches
    for (const [ya, yb] of [[12.95, 13.45], [19.05, 19.55]]) {
      const xa = 4.90, xb = 5.45, lift = 0.05;
      B.poly('glassNb', [[xa, ya, roofTop(xa) + lift], [xb, ya, roofTop(xb) + lift], [xb, yb, roofTop(xb) + lift], [xa, yb, roofTop(xa) + lift]], [-s, 0, c], { ext: 1 });
      B.poly('zinc', [[xa, ya, roofTop(xa)], [xb, ya, roofTop(xb)], [xb, ya, roofTop(xb) + lift], [xa, ya, roofTop(xa) + lift]], [0, -1, 0], { ext: 1, col: '#3a3d40' });
      B.poly('zinc', [[xa, yb, roofTop(xa)], [xb, yb, roofTop(xb)], [xb, yb, roofTop(xb) + lift], [xa, yb, roofTop(xa) + lift]], [0, 1, 0], { ext: 1, col: '#3a3d40' });
      B.poly('zinc', [[xa, ya, roofTop(xa)], [xa, yb, roofTop(xa)], [xa, yb, roofTop(xa) + lift], [xa, ya, roofTop(xa) + lift]], [-1, 0, 0], { ext: 1, col: '#3a3d40' });
    }
    // chimneys
    const chim = (x0, x1, yA, yB) => {
      const base = roofTop(x1) - 0.3;
      B.box(x0, x1, yA, yB, base, 8.22, { mat: 'zinc', col: '#55595d', ext: 1 });
      B.box(x0 - 0.05, x1 + 0.05, yA - 0.05, yB + 0.05, 8.22, 8.27, { mat: 'zinc', col: '#46494c', ext: 1 });
      B.box(x0 + 0.08, x1 - 0.08, yA + 0.08, yB - 0.08, 8.27, 8.34, { mat: 'zinc', col: '#2c2e30', ext: 1 });
    };
    chim(4.51, 4.86, 12.24, 12.59);
    chim(4.47, 4.85, 19.73, 19.99);
    // party parapet (built once)
    if (!nb) {
      B.prismY([[xs, zS - 0.1], [rx, rz - 0.1], [rx, rz + 0.12], [xs, zS + 0.12]], 11.93, 12.05, { mat: 'zinc', col: '#6b6f73', ext: 1 });
      B.prismY([[rx, rz - 0.1], [xr, zR - 0.1], [xr, zR + 0.12], [rx, rz + 0.12]], 11.93, 12.05, { mat: 'zinc', col: '#6b6f73', ext: 1 });
    }
  }

  // ---- Basement exterior (garage front) & ramp ----
  B.group = 'basement';
  ew('x', 1.68, 1.93, 12.26, 17.81, -2.80, -0.30, 'n', 'concrete', [{ a: 13.01, b: 17.42, zb: -2.61, zt: -0.53 }], { fz: LV.B, cz: LV.BC });
  if (nb) B.box(1.77, 1.83, 13.01, 17.42, -2.61, -0.53, { mat: 'garageDoor', ext: 1, collide: true });
  // garage door frame trim
  B.box(1.66, 1.70, 12.95, 17.48, -0.56, -0.50, { mat: 'metal', col: '#d8d8d4', ext: 1 });
  B.group = 'site';
  // terrace (street side)
  B.floor(0.07, 1.60, 12.35, 19.47, -0.01, 'deck', { ext: 1 });
  B.floor(1.60, 2.67, 18.19, 19.47, -0.01, 'deck', { ext: 1 });
  B.box(0.07, 1.60, 12.35, 17.86, -0.30, -0.01, { mat: 'fascia', ext: 1, f: { zp: null } });
  B.box(0.07, 1.60, 17.86, 19.47, -0.70, -0.01, { mat: 'fascia', ext: 1, f: { zp: null } });
  B.box(1.60, 2.67, 18.19, 19.47, -0.70, -0.01, { mat: 'fascia', ext: 1, f: { zp: null } });
  railing(B, [[0.10, 19.47], [0.10, 12.38], [1.60, 12.38]], -0.01, 1.0, { posts: 12 });
  // steps from the side path up to the porch
  const steps = [[19.47, 19.74, -0.17], [19.74, 20.03, -0.33], [20.03, 20.31, -0.49]];
  for (const [ya, yb, z] of steps) { B.box(0.40, 2.60, ya, yb, -0.70, z, { mat: 'deck', ext: 1, f: { xn: 'fascia', xp: 'fascia', yp: 'fascia', yn: 'fascia' } }); B.addWalk(0.40, 2.60, ya, yb, z, 'deck'); }
  // rear deck & steps
  B.box(8.86, 11.63, 12.21, 17.68, -0.70, -0.15, { mat: 'fascia', ext: 1, f: { zp: 'deck' } }); B.addWalk(8.86, 11.63, 12.21, 17.68, -0.15, 'deck');
  B.box(10.53, 11.63, 17.68, 18.06, -0.70, -0.15, { mat: 'fascia', ext: 1, f: { zp: 'deck' } }); B.addWalk(10.53, 11.63, 17.68, 18.06, -0.15, 'deck');
  const rs = [[18.06, 18.36, -0.28], [18.36, 18.66, -0.41], [18.66, 18.96, -0.54]];
  for (const [ya, yb, z] of rs) { B.box(10.60, 11.63, ya, yb, -0.72, z, { mat: 'fascia', ext: 1, f: { zp: 'deck' } }); B.addWalk(10.60, 11.63, ya, yb, z, 'deck'); }
  // canopy over the rear terrace (aluminium frame, polycarbonate)
  B.box(11.33, 11.45, 12.25, 17.62, 2.34, 2.52, { mat: 'fascia', ext: 1 });
  for (let y = 12.25; y < 17.7; y += 1.07) B.box(10.23, 11.45, Math.min(y, 17.54), Math.min(y, 17.54) + 0.08, 2.44, 2.52, { mat: 'fascia', ext: 1 });
  B.poly('poly', [[10.23, 12.25, 2.535], [11.45, 12.25, 2.535], [11.45, 17.62, 2.535], [10.23, 17.62, 2.535]], [0, 0, 1], { ext: 1 });
  // bamboo roll blind
  B.poly('bamboo', [[11.40, 12.45, 1.62], [11.40, 14.85, 1.62], [11.40, 14.85, 2.34], [11.40, 12.45, 2.34]], [1, 0, 0], { ext: 1 });
  B.cylP([11.40, 12.40, 1.60], [11.40, 14.90, 1.60], 0.035, 6, { mat: 'paint', col: '#b89668', ext: 1 });
  // side path, gravel strips
  B.poly('pavers', [[-1.3, 20.31, -0.645], [2.67, 20.31, -0.645], [2.67, 21.34, -0.645], [-1.3, 21.34, -0.645]], [0, 0, 1], { ext: 1 });
  B.poly('pavers', [[-1.3, 21.34, -0.645], [11.63, 21.34, -0.645], [11.63, 22.10, -0.645], [-1.3, 22.10, -0.645]], [0, 0, 1], { ext: 1 });
  // path from the street entrance gate to the porch steps
  B.poly('pavers', [[-11.30, 17.34, -0.645], [-9.10, 17.34, -0.645], [-9.10, 19.30, -0.645], [-11.30, 19.30, -0.645]], [0, 0, 1], { ext: 1 });
  B.poly('pavers', [[-9.10, 18.25, -0.645], [-0.30, 18.25, -0.645], [-0.30, 19.30, -0.645], [-9.10, 19.30, -0.645]], [0, 0, 1], { ext: 1 });
  B.poly('pavers', [[-1.30, 19.30, -0.645], [-0.30, 19.30, -0.645], [-0.30, 20.31, -0.645], [-1.30, 20.31, -0.645]], [0, 0, 1], { ext: 1 });
  B.poly('gravel', [[2.67, 20.34, -0.647], [4.03, 20.34, -0.647], [4.03, 21.34, -0.647], [2.67, 21.34, -0.647]], [0, 0, 1], { ext: 1 });
  B.poly('gravel', [[8.545, 20.34, -0.647], [10.60, 20.34, -0.647], [10.60, 21.34, -0.647], [8.545, 21.34, -0.647]], [0, 0, 1], { ext: 1 });
  // lightwell grate for the basement window
  B.box(4.80, 5.86, 21.29, 21.73, -1.30, -0.64, { mat: 'concrete', ext: 1, f: { zp: null, yn: null } });
  B.poly('grate', [[4.84, 21.30, -0.645], [5.82, 21.30, -0.645], [5.82, 21.69, -0.645], [4.84, 21.69, -0.645]], [0, 0, 1], { ext: 1 });
  // ramp
  const rampH = (x) => x >= 0.40 ? -2.61 : x >= -1.60 ? -2.61 + (0.40 - x) * 0.10 : x >= -8.90 ? -2.41 + (-1.60 - x) * 0.20 : x >= -10.90 ? -0.95 + (-8.90 - x) * 0.10 : -0.75;
  const rx = [-11.30, -10.90, -8.90, -1.60, 0.40, 1.68];
  for (let i = 0; i < rx.length - 1; i++) {
    const a = rx[i], b = rx[i + 1];
    const ya = a < -8.9 ? 13.44 : 12.61, yb = a < -8.9 ? 17.04 : 17.86;
    B.poly(a >= 0.40 ? 'concrete' : 'grassPaver', [[a, ya, rampH(a)], [b, ya, rampH(b)], [b, yb, rampH(b)], [a, yb, rampH(a)]], [0, 0, 1], { ext: 1 });
  }
  B.poly('grate', [[0.60, 12.61, -2.605], [0.80, 12.61, -2.605], [0.80, 17.86, -2.605], [0.60, 17.86, -2.605]], [0, 0, 1], { ext: 1 });
  for (const [ya, yb, side] of [[12.41, 12.61, 'yp'], [17.86, 18.06, 'yn']]) {
    B.box(-8.90, 1.68, ya, yb, -2.80, -0.56, { mat: 'concrete', ext: 1 });
    // planted hedge on top of the retaining walls (also a safety barrier)
    B.box(-8.70, 0.05, ya - 0.10, yb + 0.10, -0.56, 0.15, { mat: 'foliage', ext: 1, collide: true });
  }
  // the ramp narrows to the width of the street gate for its last, nearly level stretch
  B.box(-9.10, -8.90, 12.41, 13.44, -1.40, -0.56, { mat: 'concrete', ext: 1 });
  B.box(-9.10, -8.90, 17.04, 18.06, -1.40, -0.56, { mat: 'concrete', ext: 1 });
  B.box(-11.30, -9.10, 13.24, 13.44, -1.20, -0.62, { mat: 'concrete', ext: 1 });
  B.box(-11.30, -9.10, 17.04, 17.24, -1.20, -0.62, { mat: 'concrete', ext: 1 });
  B.group = 'site'; B.forceGroup = null;
}
