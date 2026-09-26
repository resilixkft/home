// ---------- Interior (our half only) ----------
function iw(B, axis, t0, t1, a, b, z0, z1, fz, cz, open = [], extra = {}) {
  B.wall(axis, t0, t1, a, b, z0, z1, Object.assign({ mat: 'plaster', open, fz, cz }, extra));
}
// door casing + lining for an opening in an interior (or inner layer) wall
function doorTrim(B, axis, t0, t1, a, b, z0, h) {
  const cw = 0.07, ct = 0.015, zt = z0 + h;
  const o = { mat: 'woodLight', ext: 0 };
  // lining
  bxA(B, axis, t0, t1, a, a + 0.025, z0, zt, o); bxA(B, axis, t0, t1, b - 0.025, b, z0, zt, o);
  bxA(B, axis, t0, t1, a, b, zt - 0.025, zt, o);
  // casings both faces
  for (const [c0, c1] of [[t0 - ct, t0], [t1, t1 + ct]]) {
    bxA(B, axis, c0, c1, a - cw, a, z0, zt + cw, o); bxA(B, axis, c0, c1, b, b + cw, z0, zt + cw, o);
    bxA(B, axis, c0, c1, a, b, zt, zt + cw, o);
  }
}
// dynamic door leaf, registered for interaction
function doorLeaf(B, def) {
  // def: {id, group, hinge:[x,y], closed:[dx,dy], open:[dx,dy], w, z0, h, t, mat, glass, handleMat, startOpen, label}
  const D = new Builder(); D.group = def.group; D.collide = false;
  const [hx, hy] = def.hinge, [dx, dy] = def.closed, w = def.w, t = def.t || 0.04, z0 = def.z0, h = def.h;
  const ex = hx + dx * w, ey = hy + dy * w;
  const x0 = Math.min(hx, ex) - (dx === 0 ? t / 2 : 0), x1 = Math.max(hx, ex) + (dx === 0 ? t / 2 : 0);
  const y0 = Math.min(hy, ey) - (dy === 0 ? t / 2 : 0), y1 = Math.max(hy, ey) + (dy === 0 ? t / 2 : 0);
  if (def.glass) {
    const fw = 0.09;
    // frame of a glazed leaf
    const seg = (s0, s1, za, zb) => { if (dx !== 0) D.box(Math.min(hx + dx * s0, hx + dx * s1), Math.max(hx + dx * s0, hx + dx * s1), y0, y1, za, zb, { mat: def.mat, ext: 1 });
      else D.box(x0, x1, Math.min(hy + dy * s0, hy + dy * s1), Math.max(hy + dy * s0, hy + dy * s1), za, zb, { mat: def.mat, ext: 1 }); };
    seg(0, fw, z0, z0 + h); seg(w - fw, w, z0, z0 + h); seg(fw, w - fw, z0, z0 + 0.14); seg(fw, w - fw, z0 + h - fw, z0 + h);
    const gA = fw, gB = w - fw, za = z0 + 0.14, zb = z0 + h - fw;
    if (dx !== 0) D.poly('glass', [[hx + dx * gA, (y0 + y1) / 2, za], [hx + dx * gB, (y0 + y1) / 2, za], [hx + dx * gB, (y0 + y1) / 2, zb], [hx + dx * gA, (y0 + y1) / 2, zb]], [0, 1, 0], { ext: 1 });
    else D.poly('glass', [[(x0 + x1) / 2, hy + dy * gA, za], [(x0 + x1) / 2, hy + dy * gB, za], [(x0 + x1) / 2, hy + dy * gB, zb], [(x0 + x1) / 2, hy + dy * gA, zb]], [1, 0, 0], { ext: 1 });
  } else {
    D.box(x0, x1, y0, y1, z0, z0 + h, { mat: def.mat, ext: def.ext || 0 });
  }
  // handles on both faces near the free edge
  const hxp = hx + dx * (w - 0.08), hyp = hy + dy * (w - 0.08), hz = z0 + 1.02;
  if (!def.noHandle) {
    if (dx !== 0) { D.box(hxp - 0.012, hxp + 0.012, y0 - 0.06, y1 + 0.06, hz - 0.012, hz + 0.012, { mat: 'metal', col: '#b0b3b5', ext: 0 });
      D.box(hxp - (dx > 0 ? 0.12 : 0) , hxp + (dx < 0 ? 0.12 : 0), y0 - 0.065, y0 - 0.045, hz - 0.012, hz + 0.012, { mat: 'metal', col: '#b0b3b5', ext: 0 });
      D.box(hxp - (dx > 0 ? 0.12 : 0) , hxp + (dx < 0 ? 0.12 : 0), y1 + 0.045, y1 + 0.065, hz - 0.012, hz + 0.012, { mat: 'metal', col: '#b0b3b5', ext: 0 }); }
    else { D.box(x0 - 0.06, x1 + 0.06, hyp - 0.012, hyp + 0.012, hz - 0.012, hz + 0.012, { mat: 'metal', col: '#b0b3b5', ext: 0 });
      D.box(x0 - 0.065, x0 - 0.045, hyp - (dy > 0 ? 0.12 : 0), hyp + (dy < 0 ? 0.12 : 0), hz - 0.012, hz + 0.012, { mat: 'metal', col: '#b0b3b5', ext: 0 });
      D.box(x1 + 0.045, x1 + 0.065, hyp - (dy > 0 ? 0.12 : 0), hyp + (dy < 0 ? 0.12 : 0), hz - 0.012, hz + 0.012, { mat: 'metal', col: '#b0b3b5', ext: 0 }); }
  }
  const ang = (v) => Math.atan2(v[1], v[0]);
  let th = ang(def.closed) - ang(def.open); while (th > Math.PI) th -= 2 * Math.PI; while (th < -Math.PI) th += 2 * Math.PI;
  B.doorDefs.push(Object.assign({}, def, { builder: D, openAngle: th, box: { x0, x1, y0, y1, z0, z1: z0 + h }, center: [(hx + ex) / 2, (hy + ey) / 2, z0 + 1.1] }));
}

// ---------- furniture helpers ----------
function chair(B, cx, cy, yaw, col = '#f3f2ee', z0 = 0) {
  const o = { mat: 'paint', col, ext: 0 };
  B.boxR(cx, cy, z0 + 0.44, 0.44, 0.42, 0.04, yaw, o);
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const P = (lx, ly) => [cx + lx * c - ly * s, cy + lx * s + ly * c];
  for (const [lx, ly] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) { const p = P(lx, ly); B.box(p[0] - 0.018, p[0] + 0.018, p[1] - 0.018, p[1] + 0.018, z0, z0 + 0.44, o); }
  // back (towards local -y)
  for (const lx of [-0.19, 0.19]) { const p = P(lx, -0.19); B.box(p[0] - 0.018, p[0] + 0.018, p[1] - 0.018, p[1] + 0.018, z0 + 0.44, z0 + 0.92, o); }
  for (const lx of [-0.09, 0, 0.09]) { const p = P(lx, -0.19); B.box(p[0] - 0.008, p[0] + 0.008, p[1] - 0.008, p[1] + 0.008, z0 + 0.48, z0 + 0.88, o); }
  B.boxR(P(0, -0.19)[0], P(0, -0.19)[1], z0 + 0.86, 0.42, 0.03, 0.06, yaw, o);
  B.addCollider(cx - 0.24, cx + 0.24, cy - 0.24, cy + 0.24, z0, z0 + 0.9);
  if (!B.mirror) B.seats.push({ kind: 'sit', x: cx, y: cy, seatZ: z0 + 0.46, face: [-s, c], label: 'chair' });
}
function sofa(B, x0, x1, y0, y1, backSide, col, cushion = '#cfd0cf') {
  // backSide: 'yp','yn','xp','xn'
  const o = { mat: 'fabric', col, ext: 0 };
  B.box(x0 + 0.02, x1 - 0.02, y0 + 0.02, y1 - 0.02, 0, 0.08, { mat: 'paint', col: '#2b2b2b', ext: 0 });
  B.box(x0, x1, y0, y1, 0.08, 0.40, o);
  const bt = 0.20, at = 0.18;
  if (backSide === 'yp' || backSide === 'yn') {
    const by0 = backSide === 'yp' ? y1 - bt : y0, by1 = backSide === 'yp' ? y1 : y0 + bt;
    B.box(x0, x1, by0, by1, 0.40, 0.86, o);
    B.box(x0, x0 + at, y0, y1, 0.40, 0.62, o); B.box(x1 - at, x1, y0, y1, 0.40, 0.62, o);
    const n = Math.max(1, Math.round((x1 - x0 - 2 * at) / 0.62)), w = (x1 - x0 - 2 * at) / n;
    for (let i = 0; i < n; i++) { const a = x0 + at + i * w; B.box(a + 0.01, a + w - 0.01, backSide === 'yp' ? y0 + 0.02 : y0 + bt, backSide === 'yp' ? y1 - bt : y1 - 0.02, 0.40, 0.50, o);
      B.box(a + 0.04, a + w - 0.04, backSide === 'yp' ? y1 - bt - 0.14 : y0 + bt, backSide === 'yp' ? y1 - bt : y0 + bt + 0.14, 0.50, 0.80, { mat: 'fabric', col: cushion, ext: 0 }); }
  } else {
    const bx0 = backSide === 'xp' ? x1 - bt : x0, bx1 = backSide === 'xp' ? x1 : x0 + bt;
    B.box(bx0, bx1, y0, y1, 0.40, 0.86, o);
    B.box(x0, x1, y0, y0 + at, 0.40, 0.62, o); B.box(x0, x1, y1 - at, y1, 0.40, 0.62, o);
    const n = Math.max(1, Math.round((y1 - y0 - 2 * at) / 0.62)), w = (y1 - y0 - 2 * at) / n;
    for (let i = 0; i < n; i++) { const a = y0 + at + i * w; B.box(backSide === 'xp' ? x0 + 0.02 : x0 + bt, backSide === 'xp' ? x1 - bt : x1 - 0.02, a + 0.01, a + w - 0.01, 0.40, 0.50, o);
      B.box(backSide === 'xp' ? x1 - bt - 0.14 : x0 + bt, backSide === 'xp' ? x1 - bt : x0 + bt + 0.14, a + 0.04, a + w - 0.04, 0.50, 0.80, { mat: 'fabric', col: cushion, ext: 0 }); }
  }
  B.addCollider(x0, x1, y0, y1, 0, 0.86);
  if (!B.mirror) {
    const face = { yp: [0, -1], yn: [0, 1], xp: [-1, 0], xn: [1, 0] }[backSide], along = (backSide === 'yp' || backSide === 'yn');
    const L = along ? x1 - x0 - 2 * at : y1 - y0 - 2 * at, n = Math.max(1, Math.round(L / 0.62));
    for (let i = 0; i < n; i++) {
      const u = (along ? x0 : y0) + at + (i + 0.5) * L / n, cx = along ? u : (x0 + x1) / 2 + face[0] * 0.09, cy = along ? (y0 + y1) / 2 + face[1] * 0.09 : u;
      B.seats.push({ kind: 'sit', x: cx, y: cy, seatZ: 0.50, face, label: 'sofa' });
    }
  }
}
function bed(B, x0, x1, y0, y1, head, z, duvet = '#e4dfd4', frame = '#d9d4ca') {
  // head: side where the headboard is: 'xn','xp','yn','yp'
  const f = { mat: 'fabric', col: frame, ext: 0 };
  B.box(x0, x1, y0, y1, z, z + 0.30, f);
  B.box(x0 + 0.03, x1 - 0.03, y0 + 0.03, y1 - 0.03, z + 0.30, z + 0.52, { mat: 'fabric', col: '#f4f3ef', ext: 0 });
  const hb = 0.08;
  let pillows = [];
  if (head === 'yn') { B.box(x0, x1, y0 - hb, y0, z, z + 1.05, f); B.box(x0 + 0.01, x1 - 0.01, y0 + 0.55, y1 + 0.02, z + 0.50, z + 0.60, { mat: 'fabric', col: duvet, ext: 0 }); pillows = [[x0 + 0.1, x1 - 0.1, y0 + 0.08, y0 + 0.48]]; }
  if (head === 'yp') { B.box(x0, x1, y1, y1 + hb, z, z + 1.05, f); B.box(x0 + 0.01, x1 - 0.01, y0 - 0.02, y1 - 0.55, z + 0.50, z + 0.60, { mat: 'fabric', col: duvet, ext: 0 }); pillows = [[x0 + 0.1, x1 - 0.1, y1 - 0.48, y1 - 0.08]]; }
  if (head === 'xn') { B.box(x0 - hb, x0, y0, y1, z, z + 1.05, f); B.box(x0 + 0.55, x1 + 0.02, y0 + 0.01, y1 - 0.01, z + 0.50, z + 0.60, { mat: 'fabric', col: duvet, ext: 0 }); pillows = [[x0 + 0.08, x0 + 0.48, y0 + 0.1, y1 - 0.1]]; }
  if (head === 'xp') { B.box(x1, x1 + hb, y0, y1, z, z + 1.05, f); B.box(x0 - 0.02, x1 - 0.55, y0 + 0.01, y1 - 0.01, z + 0.50, z + 0.60, { mat: 'fabric', col: duvet, ext: 0 }); pillows = [[x1 - 0.48, x1 - 0.08, y0 + 0.1, y1 - 0.1]]; }
  for (const [a, b, c, d] of pillows) {
    const wide = (b - a) > (d - c);
    if (wide && b - a > 1.0) { const m = (a + b) / 2; B.box(a, m - 0.04, c, d, z + 0.52, z + 0.66, { mat: 'fabric', col: '#ffffff', ext: 0 }); B.box(m + 0.04, b, c, d, z + 0.52, z + 0.66, { mat: 'fabric', col: '#ffffff', ext: 0 }); }
    else if (!wide && d - c > 1.0) { const m = (c + d) / 2; B.box(a, b, c, m - 0.04, z + 0.52, z + 0.66, { mat: 'fabric', col: '#ffffff', ext: 0 }); B.box(a, b, m + 0.04, d, z + 0.52, z + 0.66, { mat: 'fabric', col: '#ffffff', ext: 0 }); }
    else B.box(a, b, c, d, z + 0.52, z + 0.66, { mat: 'fabric', col: '#ffffff', ext: 0 });
  }
  B.addCollider(x0 - 0.05, x1 + 0.05, y0 - 0.05, y1 + 0.05, z, z + 0.7);
  if (!B.mirror) {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const hd = { yn: [[cx, y0 + 0.28], [0, 1]], yp: [[cx, y1 - 0.28], [0, -1]], xn: [[x0 + 0.28, cy], [1, 0]], xp: [[x1 - 0.28, cy], [-1, 0]] }[head];
    B.seats.push({ kind: 'lie', x: hd[0][0], y: hd[0][1], seatZ: z + 0.52, face: hd[1], label: 'bed' });
  }
}
function cabinet(B, x0, x1, y0, y1, z0, z1, face, o = {}) {
  // plain cabinet with door fronts on 'face' side; doors split every ~0.5m
  const col = o.col || '#f0efea', gap = 0.004;
  B.box(x0, x1, y0, y1, z0, z1, { mat: 'paint', col, ext: 0, collide: o.collide !== false });
  const along = (face === 'xn' || face === 'xp') ? [y0, y1] : [x0, x1];
  const n = o.n || Math.max(1, Math.round((along[1] - along[0]) / 0.5)), w = (along[1] - along[0]) / n;
  const hcol = o.handle || '#1e1e1e';
  const label = o.label || (z1 - z0 > 1.4 ? 'wardrobe door' : 'cabinet door');
  for (let i = 0; i < n; i++) {
    const a = along[0] + i * w + gap, b = along[0] + (i + 1) * w - gap;
    const za = z0 + (o.plinth || 0) + gap, zb = z1 - gap;
    const hm = (i % 2 === 0) ? b - 0.05 : a + 0.05, hz0 = o.handleLow ? za + 0.08 : (zb - za > 1 ? za + 0.9 : zb - 0.14), hz1 = hz0 + (zb - za > 1 ? 0.25 : 0.1);
    const build = (D) => {
      if (face === 'xp') { D.box(x1, x1 + 0.018, a, b, za, zb, { mat: 'paint', col, ext: 0 }); D.box(x1 + 0.018, x1 + 0.035, hm - 0.008, hm + 0.008, hz0, hz1, { mat: 'metal', col: hcol, ext: 0 }); }
      if (face === 'xn') { D.box(x0 - 0.018, x0, a, b, za, zb, { mat: 'paint', col, ext: 0 }); D.box(x0 - 0.035, x0 - 0.018, hm - 0.008, hm + 0.008, hz0, hz1, { mat: 'metal', col: hcol, ext: 0 }); }
      if (face === 'yp') { D.box(a, b, y1, y1 + 0.018, za, zb, { mat: 'paint', col, ext: 0 }); D.box(hm - 0.008, hm + 0.008, y1 + 0.018, y1 + 0.035, hz0, hz1, { mat: 'metal', col: hcol, ext: 0 }); }
      if (face === 'yn') { D.box(a, b, y0 - 0.018, y0, za, zb, { mat: 'paint', col, ext: 0 }); D.box(hm - 0.008, hm + 0.008, y0 - 0.035, y0 - 0.018, hz0, hz1, { mat: 'metal', col: hcol, ext: 0 }); }
    };
    if (o.open === false || B.mirror) { build(B); continue; }
    // shadowed inside, only seen when the door is open
    { const dk = hex(col).map(v => v * 0.42), dc = '#' + dk.map(v => ('0' + Math.round(v).toString(16)).slice(-2)).join(''), io = { col: dc, ext: 0 };
      if (face === 'xp') B.poly('paint', [[x1 + 0.001, a, za], [x1 + 0.001, b, za], [x1 + 0.001, b, zb], [x1 + 0.001, a, zb]], [1, 0, 0], io);
      if (face === 'xn') B.poly('paint', [[x0 - 0.001, a, za], [x0 - 0.001, b, za], [x0 - 0.001, b, zb], [x0 - 0.001, a, zb]], [-1, 0, 0], io);
      if (face === 'yp') B.poly('paint', [[a, y1 + 0.001, za], [b, y1 + 0.001, za], [b, y1 + 0.001, zb], [a, y1 + 0.001, zb]], [0, 1, 0], io);
      if (face === 'yn') B.poly('paint', [[a, y0 - 0.001, za], [b, y0 - 0.001, za], [b, y0 - 0.001, zb], [a, y0 - 0.001, zb]], [0, -1, 0], io); }
    // hinge on the edge away from the handle, door swings out of the face
    const hEdge = (i % 2 === 0) ? a : b, sgn = (i % 2 === 0) ? 1 : -1, zc = (za + zb) / 2;
    let hinge, closed, open, center;
    if (face === 'xp') { hinge = [x1 + 0.009, hEdge]; closed = [0, sgn]; open = [1, 0]; center = [x1 + 0.02, (a + b) / 2, zc]; }
    if (face === 'xn') { hinge = [x0 - 0.009, hEdge]; closed = [0, sgn]; open = [-1, 0]; center = [x0 - 0.02, (a + b) / 2, zc]; }
    if (face === 'yp') { hinge = [hEdge, y1 + 0.009]; closed = [sgn, 0]; open = [0, 1]; center = [(a + b) / 2, y1 + 0.02, zc]; }
    if (face === 'yn') { hinge = [hEdge, y0 - 0.009]; closed = [sgn, 0]; open = [0, -1]; center = [(a + b) / 2, y0 - 0.02, zc]; }
    B.mover({ hinge, openAngle: hingeAng(closed, open, 1.05), w: b - a, label, center }, build);
  }
}
function picture(B, axis, plane, dir, a0, a1, z0, z1, cell, o = {}) {
  // framed picture on a wall. axis 'x': wall face at x=plane facing dir (+1/-1); along y from a0..a1
  const fr = o.frame || 0.025, d = o.depth || 0.025, fcol = o.fcol || '#141414', mat = o.mat || 'art';
  const u0 = (cell % 4) / 4, v0 = ((cell / 4) | 0) / 4, u1 = u0 + 0.25, v1 = v0 + 0.25;
  const p0 = plane, p1 = plane + dir * d;
  const lo = Math.min(p0, p1), hi = Math.max(p0, p1);
  const mat0 = o.mat0 !== undefined ? o.mat0 : 0.035; // passe-partout
  if (axis === 'x') {
    B.box(lo, hi, a0, a1, z0, z1, { mat: 'paint', col: fcol, ext: 0 });
    const x = hi * (dir > 0 ? 1 : 0) + lo * (dir < 0 ? 1 : 0) + dir * 0.001;
    if (mat0 > 0) B.poly('paint', [[x, a0 + fr, z0 + fr], [x, a1 - fr, z0 + fr], [x, a1 - fr, z1 - fr], [x, a0 + fr, z1 - fr]], [dir, 0, 0], { col: '#f5f4f0', ext: 0 });
    const x2 = x + dir * 0.001, m = fr + mat0;
    const uv = dir < 0 ? [[u0, v1], [u1, v1], [u1, v0], [u0, v0]] : [[u1, v1], [u0, v1], [u0, v0], [u1, v0]];
    B.poly(mat, [[x2, a0 + m, z0 + m], [x2, a1 - m, z0 + m], [x2, a1 - m, z1 - m], [x2, a0 + m, z1 - m]], [dir, 0, 0], { ext: 0, uvs: uv });
  } else {
    B.box(a0, a1, lo, hi, z0, z1, { mat: 'paint', col: fcol, ext: 0 });
    const y = hi * (dir > 0 ? 1 : 0) + lo * (dir < 0 ? 1 : 0) + dir * 0.001;
    if (mat0 > 0) B.poly('paint', [[a0 + fr, y, z0 + fr], [a1 - fr, y, z0 + fr], [a1 - fr, y, z1 - fr], [a0 + fr, y, z1 - fr]], [0, dir, 0], { col: '#f5f4f0', ext: 0 });
    const y2 = y + dir * 0.001, m = fr + mat0;
    const uv = dir > 0 ? [[u0, v1], [u1, v1], [u1, v0], [u0, v0]] : [[u1, v1], [u0, v1], [u0, v0], [u1, v0]];
    B.poly(mat, [[a0 + m, y2, z0 + m], [a1 - m, y2, z0 + m], [a1 - m, y2, z1 - m], [a0 + m, y2, z1 - m]], [0, dir, 0], { ext: 0, uvs: uv });
  }
}
function plant(B, x, y, z, h = 1.0, r = 0.3, pot = '#b86b43') {
  B.cone(x, y, z, z + 0.32, 0.16, 0.20, 10, { mat: 'paint', col: pot, ext: 0 });
  B.sph(x, y, z + 0.32 + h * 0.45, r, r, h * 0.5, 8, { mat: 'foliage', ext: 0 });
  B.addCollider(x - 0.2, x + 0.2, y - 0.2, y + 0.2, z, z + 0.4 + h);
}
function curtain(B, axis, plane, a0, a1, z0, z1) {
  if (axis === 'x') B.poly('curtain', [[plane, a0, z0], [plane, a1, z0], [plane, a1, z1], [plane, a0, z1]], [1, 0, 0], { ext: 0 });
  else B.poly('curtain', [[a0, plane, z0], [a1, plane, z0], [a1, plane, z1], [a0, plane, z1]], [0, 1, 0], { ext: 0 });
}
function toilet(B, x, y, dir, z0 = 0) { // dir: direction the bowl points (plan unit vector), wall behind
  const o = { mat: 'gloss', col: '#f7f7f5', ext: 0 };
  const [dx, dy] = dir, px = -dy, py = dx;
  const P = (a, b) => [x + dx * a + px * b, y + dy * a + py * b];
  const c0 = P(0.05, -0.19), c1 = P(0.20, 0.19);
  B.box(Math.min(c0[0], c1[0]), Math.max(c0[0], c1[0]), Math.min(c0[1], c1[1]), Math.max(c0[1], c1[1]), z0 + 0.18, z0 + 0.42, o);
  const bc = P(0.36, 0);
  B.cylZ(bc[0], bc[1], z0 + 0.18, z0 + 0.42, dx !== 0 ? 0.22 : 0.18, 14, Object.assign({ ry: dx !== 0 ? 0.18 : 0.22 }, o));
  B.cylZ(bc[0], bc[1], z0 + 0.42, z0 + 0.44, dx !== 0 ? 0.23 : 0.19, 14, Object.assign({ ry: dx !== 0 ? 0.19 : 0.23, mat: 'gloss', col: '#ffffff' }, { ext: 0 }));
  // flush plate on the wall
  const fp = P(0.005, 0);
  if (dx !== 0) B.box(fp[0] - 0.005, fp[0] + 0.005, fp[1] - 0.12, fp[1] + 0.12, z0 + 1.00, z0 + 1.16, { mat: 'metal', col: '#d0d2d4', ext: 0 });
  else B.box(fp[0] - 0.12, fp[0] + 0.12, fp[1] - 0.005, fp[1] + 0.005, z0 + 1.00, z0 + 1.16, { mat: 'metal', col: '#d0d2d4', ext: 0 });
  const a = P(0, -0.25), b = P(0.62, 0.25);
  B.addCollider(Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1]), z0, z0 + 0.5);
}
function basin(B, x0, x1, y0, y1, z, face, withCab = true) {
  if (withCab) cabinet(B, x0, x1, y0, y1, z - 0.55, z - 0.04, face, { col: '#f2f1ed', n: 2, handleLow: false });
  B.box(x0 - 0.01, x1 + 0.01, y0 - 0.01, y1 + 0.01, z - 0.04, z, { mat: 'gloss', col: '#f7f7f5', ext: 0 });
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  B.cylZ(cx, cy, z, z + 0.012, Math.min(x1 - x0, y1 - y0) * 0.36, 16, { mat: 'gloss', col: '#e7e9ea', ext: 0 });
  // tap
  const tx = face === 'xp' ? x0 + 0.08 : face === 'xn' ? x1 - 0.08 : cx, ty = face === 'yp' ? y0 + 0.08 : face === 'yn' ? y1 - 0.08 : cy;
  B.cylZ(tx, ty, z, z + 0.18, 0.015, 8, { mat: 'metal', col: '#c9cccf', ext: 0 });
}
function mirror(B, axis, plane, dir, a0, a1, z0, z1, frame = null) {
  const p = plane + dir * 0.012;
  if (frame) { if (axis === 'x') B.box(Math.min(plane, plane + dir * 0.02), Math.max(plane, plane + dir * 0.02), a0 - 0.05, a1 + 0.05, z0 - 0.05, z1 + 0.05, { mat: 'metal', col: frame, ext: 0 });
    else B.box(a0 - 0.05, a1 + 0.05, Math.min(plane, plane + dir * 0.02), Math.max(plane, plane + dir * 0.02), z0 - 0.05, z1 + 0.05, { mat: 'metal', col: frame, ext: 0 }); }
  const q = plane + dir * (frame ? 0.022 : 0.006);
  if (axis === 'x') B.poly('mirror', [[q, a0, z0], [q, a1, z0], [q, a1, z1], [q, a0, z1]], [dir, 0, 0], { ext: 0 });
  else B.poly('mirror', [[a0, q, z0], [a1, q, z0], [a1, q, z1], [a0, q, z1]], [0, dir, 0], { ext: 0 });
}
function radiator(B, axis, plane, dir, a0, a1, z0, z1) {
  const d0 = plane + dir * 0.04, d1 = plane + dir * 0.12;
  if (axis === 'x') B.box(Math.min(d0, d1), Math.max(d0, d1), a0, a1, z0, z1, { mat: 'paint', col: '#f4f4f2', ext: 0 });
  else B.box(a0, a1, Math.min(d0, d1), Math.max(d0, d1), z0, z1, { mat: 'paint', col: '#f4f4f2', ext: 0 });
}

function buildInterior(B) {
  B.mirror = false; B.extF = 0;
  const { G, GC, KC, U, UC, B: BF, BC } = LV;
  // =================== BASEMENT ===================
  B.group = 'basement';
  const bIn = (o) => Object.assign({ fz: BF, cz: BC }, o || {});
  // party wall + perimeter (inner faces only matter)
  iw(B, 'y', 11.99, 12.26, 1.93, 8.53, -2.80, BC, BF, BC);
  iw(B, 'x', 8.53, 8.94, 12.26, 17.81, -2.80, BC, BF, BC);
  iw(B, 'y', 17.81, 18.06, 1.68, 8.53, -2.80, BC, BF, BC, [{ a: 6.55, b: 7.45, zb: BF, zt: BF + 2.02 }]);
  doorTrim(B, 'y', 17.81, 18.06, 6.55, 7.45, BF, 2.02);
  iw(B, 'x', 2.68, 2.93, 18.06, 20.26, -2.80, BC, BF, BC);
  iw(B, 'y', 20.01, 20.26, 2.68, 4.33, -2.80, BC, BF, BC);
  iw(B, 'x', 4.23, 4.33, 19.48, 20.01, -2.80, BC, BF, BC);
  iw(B, 'x', 4.08, 4.33, 20.26, 21.24, -2.80, BC, BF, BC);
  iw(B, 'y', 20.96, 21.24, 4.33, 8.46, -2.80, BC, BF, BC, [{ a: 4.95, b: 5.70, zb: -1.15, zt: -0.65 }]);
  iw(B, 'x', 5.90, 6.00, 19.48, 20.96, -2.80, BC, BF, BC);
  iw(B, 'y', 19.48, 19.58, 4.33, 4.88, -2.80, BC, BF, BC);
  iw(B, 'y', 19.48, 19.58, 6.00, 6.30, -2.80, BC, BF, BC);
  iw(B, 'x', 6.20, 6.30, 18.06, 19.48, -2.80, BC, BF, BC, [{ a: 18.42, b: 19.30, zb: BF, zt: BF + 2.02 }]);
  doorTrim(B, 'x', 6.20, 6.30, 18.42, 19.30, BF, 2.02);
  iw(B, 'x', 8.21, 8.46, 20.34, 21.24, -2.80, BC, BF, BC);
  iw(B, 'y', 19.96, 20.06, 7.61, 8.46, -2.80, BC, BF, BC);
  // basement window (in the niche)
  windowUnit(B, 'y', 21.13, 1, 21.24, 20.96, 4.95, 5.70, -1.15, -0.65, { noSill: true });
  // floors
  const bf = [[1.93, 8.53, 12.26, 17.81, 'bTile'], [2.93, 6.20, 18.06, 19.48, 'bTile'], [2.93, 4.23, 19.48, 20.01, 'bTile'], [4.33, 5.90, 19.58, 20.96, 'bTile'], [4.88, 5.90, 19.48, 19.58, 'bTile'],
    [6.30, 7.78, 18.06, 19.96, 'bTile'], [6.00, 8.21, 20.06, 20.96, 'bTile'], [6.00, 7.61, 19.96, 20.06, 'bTile'], [6.00, 6.30, 19.58, 19.96, 'bTile'],
    [7.78, 10.23, 18.06, 18.96, 'bTile'], [7.78, 8.24, 19.06, 19.96, 'bTile'], [6.55, 7.45, 17.81, 18.06, 'bTile'], [6.20, 6.30, 18.42, 19.30, 'bTile']];
  for (const [a, b, c, d, m] of bf) B.floor(a, b, c, d, BF, m, { fz: BF, cz: BC });
  B.floor(1.66, 1.93, 13.01, 17.42, -2.60, 'concrete', { ext: 1 });
  // ceilings (in ground group so they hide with the ground floor cutaway)
  B.group = 'ground';
  const bc = [[1.93, 8.53, 12.26, 17.81], [2.93, 6.20, 18.06, 19.48], [2.93, 4.23, 19.48, 20.01], [4.33, 5.90, 19.58, 20.96], [4.88, 5.90, 19.48, 19.58],
    [6.30, 7.78, 18.06, 19.96], [6.00, 8.21, 20.06, 20.96], [6.00, 7.61, 19.96, 20.06], [6.00, 6.30, 19.58, 19.96], [7.78, 8.40, 18.06, 18.96], [7.78, 8.24, 19.06, 19.96],
    [6.55, 7.45, 17.81, 18.06], [6.20, 6.30, 18.42, 19.30]];
  for (const [a, b, c, d] of bc) B.ceil(a, b, c, d, BC, 'ceiling', { fz: BF, cz: BC });
  // GF slab edges at the stair hole
  B.box(8.24, 8.40, 18.96, 19.06, BC, G, { mat: 'plaster' });
  B.poly('plaster', [[8.40, 18.06, BC], [8.40, 18.96, BC], [8.40, 18.96, G], [8.40, 18.06, G]], [1, 0, 0], {});
  B.poly('plaster', [[8.24, 19.06, BC], [8.24, 19.96, BC], [8.24, 19.96, G], [8.24, 19.06, G]], [1, 0, 0], {});
  B.group = 'basement';
  // lamps
  for (const [x, y] of [[4.0, 15.0], [7.0, 15.0], [4.4, 18.8], [7.0, 19.1]]) lampCeil(B, x, y, BC, 0.13);
  B.box(3.0, 6.0, 14.95, 15.05, BC - 0.06, BC, { mat: 'emissive', col: '#f2f6ff' });
  // garage: emptied at the owner's request (floor drain stays)
  B.poly('grate', [[7.80, 17.03, BF + 0.005], [8.36, 17.03, BF + 0.005], [8.36, 17.59, BF + 0.005], [7.80, 17.59, BF + 0.005]], [0, 0, 1], {});
  // storage: shelves, boiler, freezer
  for (let k = 0; k < 4; k++) B.box(2.95, 3.45, 18.1, 19.9, BF + 0.35 + k * 0.45, BF + 0.38 + k * 0.45, { mat: 'oak' });
  B.addCollider(2.93, 3.45, 18.06, 19.95, BF, BF + 1.8);
  for (const [y, h] of [[18.2, 0.3], [18.7, 0.25], [19.2, 0.35]]) B.box(3.0, 3.4, y, y + 0.4, BF + 0.38, BF + 0.38 + h, { mat: 'paint', col: '#c9b18b' });
  B.box(4.36, 4.82, 19.62, 19.95, BF + 1.35, BF + 2.05, { mat: 'gloss', col: '#f1f1ef', collide: true });
  B.cylZ(4.62, 19.80, BF + 2.05, BC, 0.05, 8, { mat: 'metal', col: '#c2c4c6' });
  B.box(4.40, 5.35, 20.30, 20.92, BF, BF + 0.85, { mat: 'gloss', col: '#f4f4f2', collide: true });
  B.box(5.40, 5.85, 20.35, 20.92, BF, BF + 0.85, { mat: 'gloss', col: '#e9e9e7', collide: true });

  // =================== GROUND FLOOR ===================
  B.group = 'ground';
  const gIn = (o) => Object.assign({ fz: G, cz: GC }, o || {});
  // party wall
  iw(B, 'y', 11.99, 12.23, 1.98, 8.48, BC, 2.88, G, GC, [], { noTop: true });
  // interior partitions
  iw(B, 'y', 17.81, 18.06, 2.67, 4.88, G, GC, G, GC);
  iw(B, 'x', 6.08, 6.18, 15.36, 17.81, G, GC, G, GC);
  B.box(5.78, 6.85, 15.20, 15.36, G, GC, { mat: 'brickIn', collide: true, fz: G, cz: GC });
  iw(B, 'y', 15.26, 15.36, 7.88, 8.48, G, GC, G, GC);
  iw(B, 'y', 15.26, 15.36, 6.85, 7.88, KC, GC, G, GC);
  iw(B, 'y', 17.81, 17.91, 5.78, 6.88, G, GC, G, GC);
  iw(B, 'y', 17.81, 17.91, 6.88, 7.78, KC, GC, G, GC);
  iw(B, 'y', 17.81, 18.06, 7.78, 8.48, G, GC, G, GC);
  iw(B, 'y', 17.81, 18.06, 4.88, 5.78, 2.30, GC, G, GC);
  iw(B, 'x', 4.70, 4.80, 19.32, 19.72, G, GC, G, GC);
  B.box(4.40, 4.85, 19.72, 19.96, G, GC, { mat: 'plaster', collide: true, fz: G, cz: GC });
  iw(B, 'y', 19.96, 20.06, 4.33, 8.165, G, GC, G, GC, [{ a: 4.955, b: 5.705, zb: G, zt: 2.05 }, { a: 6.955, b: 7.705, zb: G, zt: 2.05 }]);
  doorTrim(B, 'y', 19.96, 20.06, 4.955, 5.705, G, 2.05); doorTrim(B, 'y', 19.96, 20.06, 6.955, 7.705, G, 2.05);
  iw(B, 'x', 6.335, 6.585, 20.06, 20.96, G, GC, G, GC);
  // stair stringer wall & upper parapets
  B.box(7.78, 9.28, 18.96, 19.06, BF, 3.88, { mat: 'plaster', collide: true });
  B.box(9.23, 9.33, 18.96, 19.06, BF, 3.88, { mat: 'plaster', collide: true });
  // floors
  const gf = [[1.98, 8.48, 12.23, 15.26], [1.98, 6.08, 15.26, 17.81], [6.18, 8.48, 15.36, 17.81], [6.08, 6.18, 15.26, 15.36],
    [4.88, 5.78, 17.81, 18.06], [5.78, 6.88, 17.91, 18.06], [6.88, 7.78, 17.81, 18.06], [3.05, 7.78, 18.06, 19.96],
    [7.78, 8.40, 18.06, 18.96], [7.78, 8.24, 19.06, 19.96], [4.33, 6.335, 20.06, 20.96], [6.585, 8.165, 20.06, 20.96],
    [4.955, 5.705, 19.96, 20.06], [6.955, 7.705, 19.96, 20.06], [2.67, 3.05, 18.19, 19.19], [1.60, 1.98, 13.26, 14.26], [8.48, 8.86, 14.21, 15.21]];
  for (const [a, b, c, d] of gf) B.floor(a, b, c, d, G, 'floorGF', { fz: G, cz: GC });
  // ceilings (upper group hides them in cutaway)
  B.group = 'upper';
  const gc = [[1.98, 8.48, 12.23, 15.26, GC], [1.98, 6.08, 15.26, 17.81, GC], [6.18, 8.48, 15.36, 17.81, KC], [4.88, 5.78, 17.81, 18.06, 2.30],
    [5.78, 6.88, 17.91, 18.06, GC], [6.88, 7.78, 17.91, 18.06, GC], [3.05, 7.78, 18.06, 19.96, GC], [7.78, 8.20, 18.06, 18.96, GC], [7.78, 8.20, 19.06, 19.96, GC],
    [4.33, 6.335, 20.06, 20.96, GC], [6.585, 8.165, 20.06, 20.96, GC]];
  for (const [a, b, c, d, z] of gc) B.ceil(a, b, c, d, z, 'ceiling', { fz: G, cz: GC });
  // upper slab edge at stair void
  B.poly('plaster', [[8.20, 18.06, GC], [8.20, 18.96, GC], [8.20, 18.96, U], [8.20, 18.06, U]], [1, 0, 0], {});
  B.poly('plaster', [[8.20, 19.06, GC], [8.20, 19.96, GC], [8.20, 19.96, U], [8.20, 19.06, U]], [1, 0, 0], {});
  // kitchen soffit edges already via partial walls
  B.group = 'ground';

  // ---- GF furniture ----
  // fireplace, chimney breast and the BILLY bookcases: see living.js
  // living room: furniture removed at the owner's request (chimney breast, fireplace and curtains stay)
  // curtains (sheer) at the street glazing
  curtain(B, 'x', 2.00, 13.28, 14.05, 0.02, 2.55); curtain(B, 'x', 2.00, 14.28, 15.05, 0.02, 2.55); curtain(B, 'x', 2.00, 16.05, 16.84, 0.02, 2.55);
  B.box(2.00, 2.05, 13.2, 16.95, 2.55, 2.58, { mat: 'metal', col: '#d6d6d3' });
  // dining table (1.60 x 0.90), long side parallel to the garden wall; two chairs on each long side and one at each end.
  // The east end chair stands clear of the radiator under the garden window.
  const DX = 7.05, DY = 13.60, tx0 = DX - 0.80, tx1 = DX + 0.80, ty0 = DY - 0.45, ty1 = DY + 0.45;
  B.box(tx0, tx1, ty0, ty1, 0.72, 0.76, { mat: 'oak', collide: true });
  for (const [x, y] of [[tx0 + 0.05, ty0 + 0.05], [tx1 - 0.05, ty0 + 0.05], [tx0 + 0.05, ty1 - 0.05], [tx1 - 0.05, ty1 - 0.05]]) B.box(x - 0.03, x + 0.03, y - 0.03, y + 0.03, 0, 0.72, { mat: 'paint', col: '#f3f2ee' });
  for (const x of [DX - 0.40, DX + 0.40]) { chair(B, x, ty0 - 0.30, 0); chair(B, x, ty1 + 0.30, Math.PI); }
  chair(B, tx0 - 0.28, DY, -Math.PI / 2); chair(B, tx1 + 0.28, DY, Math.PI / 2);
  B.cylZ(DX, DY, 1.72, GC, 0.006, 4, { mat: 'metal', col: '#222' });
  B.cone(DX, DY, 1.55, 1.75, 0.26, 0.05, 16, { mat: 'metal', col: '#2d2d2d' });
  B.cylZ(DX, DY, 1.54, 1.56, 0.2, 12, { mat: 'emissive', col: '#fff3d6' });
  picture(B, 'y', 12.23, 1, DX - 0.40, DX + 0.40, 1.35, 2.10, 5, { frame: 0.03, fcol: '#f2f2f0' });
  // kitchen: left run along x=6.18
  const kf = '#ecebe3', kh = '#1a1a1a';
  B.box(6.18, 6.78, 17.21, 17.81, G, 2.38, { mat: 'paint', col: kf, collide: true }); // tall fridge column
  B.box(6.78, 6.80, 17.215, 17.805, 0.08, 0.86, { mat: 'paint', col: kf }); B.box(6.78, 6.80, 17.215, 17.805, 0.87, 2.10, { mat: 'paint', col: kf });
  B.box(6.78, 6.80, 17.215, 17.805, 2.11, 2.37, { mat: 'paint', col: kf });
  B.box(6.80, 6.82, 17.26, 17.28, 0.62, 0.84, { mat: 'metal', col: kh }); B.box(6.80, 6.82, 17.26, 17.28, 0.90, 1.12, { mat: 'metal', col: kh });
  cabinet(B, 6.18, 6.78, 16.61, 17.21, G, 0.87, 'xp', { col: kf, n: 1, plinth: 0.08, handle: kh });
  B.box(6.80, 6.82, 16.80, 17.02, 0.55, 0.57, { mat: 'metal', col: kh }); B.box(6.80, 6.82, 16.80, 17.02, 0.30, 0.32, { mat: 'metal', col: kh });
  B.box(6.18, 6.78, 16.01, 16.61, G, 0.87, { mat: 'paint', col: kf, collide: true, f: { xp: null } });
  B.box(6.78, 6.80, 16.02, 16.60, 0.10, 0.84, { mat: 'oven', f: {}, uvf: { xp: [[0, 1], [1, 1], [1, 0], [0, 0]] } });
  cabinet(B, 6.18, 6.78, 15.36, 16.01, G, 0.87, 'xp', { col: kf, n: 1, plinth: 0.08, handle: kh });
  B.box(6.18, 6.81, 15.36, 17.21, 0.87, 0.90, { mat: 'oak' });
  B.box(6.24, 6.76, 16.04, 16.58, 0.90, 0.905, { mat: 'hob', uvf: { zp: [[0, 0], [1, 0], [1, 1], [0, 1]] } });
  B.box(6.18, 6.185, 15.36, 17.21, 0.90, 1.48, { mat: 'zellige' });
  cabinet(B, 6.18, 6.53, 15.36, 17.21, 1.48, 2.38, 'xp', { col: kf, n: 4, handleLow: true, handle: kh, collide: false });
  B.box(6.20, 6.56, 16.01, 16.61, 1.40, 1.48, { mat: 'metal', col: '#9fa4a8' });
  B.box(6.28, 6.72, 15.45, 15.95, 0.90, 1.18, { mat: 'gloss', col: '#161616' });
  B.cylZ(6.62, 15.85, 0.90, 0.95, 0.09, 10, { mat: 'gloss', col: '#ffffff' });
  // kitchen: right run along the rear wall
  cabinet(B, 7.88, 8.48, 15.36, 17.81, G, 0.87, 'xn', { col: kf, n: 4, plinth: 0.08, handle: kh });
  B.box(7.85, 8.48, 15.36, 17.81, 0.87, 0.90, { mat: 'oak' });
  B.box(8.00, 8.40, 16.35, 16.83, 0.80, 0.905, { mat: 'metal', col: '#b9bec2' });
  B.cylZ(8.43, 16.59, 0.90, 1.18, 0.015, 8, { mat: 'metal', col: '#c9cccf' });
  B.box(8.18, 8.44, 16.58, 16.60, 1.16, 1.18, { mat: 'metal', col: '#c9cccf' });
  B.box(8.44, 8.48, 15.36, 15.99, 0.90, 1.50, { mat: 'zellige' }); B.box(8.44, 8.48, 17.19, 17.81, 0.90, 1.50, { mat: 'zellige' });
  lampCeil(B, 7.30, 16.60, KC, 0.12);
  lampCeil(B, 3.9, 15.0, GC, 0.18); lampCeil(B, 6.0, 19.0, GC, 0.14); lampCeil(B, 3.9, 19.0, GC, 0.12);
  lampCeil(B, 5.3, 20.5, GC, 0.1); lampCeil(B, 7.4, 20.5, GC, 0.1);
  // lobby: shoe bench + hooks; hall mirror + console
  B.box(3.10, 4.30, 19.58, 19.94, G, 0.46, { mat: 'oak', collide: true });
  B.box(3.10, 4.30, 19.93, 19.96, 1.62, 1.72, { mat: 'oak' });
  for (let i = 0; i < 5; i++) B.box(3.25 + i * 0.25, 3.28 + i * 0.25, 19.88, 19.93, 1.55, 1.64, { mat: 'metal', col: '#222' });
  B.box(3.20, 3.95, 19.86, 19.93, 0.9, 1.5, { mat: 'fabric', col: '#3f4a52' });
  mirror(B, 'y', 19.96, -1, 5.85, 6.75, 1.10, 1.95, '#c8a96b');
  B.box(5.85, 6.75, 19.66, 19.96, 0.78, 0.82, { mat: 'oak', collide: true });
  for (const x of [5.9, 6.7]) B.box(x - 0.02, x + 0.02, 19.7, 19.92, 0, 0.78, { mat: 'metal', col: '#222' });
  B.poly('rug', [[3.2, 18.35, 0.004], [4.5, 18.35, 0.004], [4.5, 19.2, 0.004], [3.2, 19.2, 0.004]], [0, 0, 1], { uvs: [[0, 0], [1, 0], [1, 1], [0, 1]], col: '#8f7f6a' });
  // WC
  toilet(B, 4.33, 20.51, [1, 0]);
  basin(B, 6.02, 6.335, 20.25, 20.70, 0.85, 'xn', false);
  mirror(B, 'x', 6.335, -1, 20.28, 20.68, 1.1, 1.6);
  B.box(4.33, 6.335, 20.955, 20.96, G, 1.20, { mat: 'bathTile' });
  // pantry shelves
  for (let k = 0; k < 5; k++) { B.box(6.60, 8.15, 20.62, 20.95, 0.4 + k * 0.4, 0.43 + k * 0.4, { mat: 'oak' }); B.box(7.82, 8.15, 20.07, 20.62, 0.4 + k * 0.4, 0.43 + k * 0.4, { mat: 'oak' }); }
  B.addCollider(6.6, 8.165, 20.62, 20.96, 0, 2.1); B.addCollider(7.82, 8.165, 20.06, 20.62, 0, 2.1);
  const jar = ['#c9a36b', '#b04a3a', '#e1d6b8', '#6f8f4c', '#d38b2c'];
  for (let k = 0; k < 18; k++) { const x = 6.7 + (k % 9) * 0.16, z = 0.43 + ((k / 9) | 0) * 0.8; B.cylZ(x, 20.78, z, z + 0.16, 0.05, 8, { mat: 'gloss', col: jar[k % 5] }); }
  radiator(B, 'x', 1.98, 1, 16.9, 17.6, 0.12, 0.62); radiator(B, 'x', 8.48, -1, 12.8, 13.9, 0.12, 0.55);

  // ---- stairs: basement <-> ground <-> upper ----
  const C = [9.28, 19.01];
  const wpoly = (k) => { // winder k (0..5) polygon from phi=30k to 30(k+1)
    const R = [9.28, 10.23, 18.06, 19.96];
    const hit = (phi) => { const dx = Math.sin(phi), dy = Math.cos(phi); let t = 1e9;
      if (dx > 1e-6) t = Math.min(t, (R[1] - C[0]) / dx); if (dy > 1e-6) t = Math.min(t, (R[3] - C[1]) / dy); if (dy < -1e-6) t = Math.min(t, (R[2] - C[1]) / dy);
      if (dx < -1e-6) t = Math.min(t, (R[0] - C[0]) / dx); return [C[0] + dx * t, C[1] + dy * t]; };
    const p0 = k * Math.PI / 6, p1 = (k + 1) * Math.PI / 6;
    const pts = [C, hit(p0)];
    const corners = [[10.23, 19.96, Math.atan2(10.23 - C[0], 19.96 - C[1])], [10.23, 18.06, Math.atan2(10.23 - C[0], 18.06 - C[1])]];
    for (const [x, y, a] of corners) if (a > p0 + 1e-6 && a < p1 - 1e-6) pts.push([x, y]);
    pts.push(hit(p1));
    return pts;
  };
  const stepPrism = (pts, z, depth, mat, grp) => {
    const g = B.group; B.group = grp;
    const top = pts.map(p => [p[0], p[1], z]), bot = pts.map(p => [p[0], p[1], z - depth]);
    B.poly(mat, top, [0, 0, 1], {}); B.poly('plaster', bot, [0, 0, -1], {});
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; const ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey); if (l < 1e-4) continue;
      let n = [ey / l, -ex / l, 0]; const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      if ((a[0] - cx) * n[0] + (a[1] - cy) * n[1] < 0) n = [-n[0], -n[1], 0];
      B.poly(mat, [[a[0], a[1], z], [b[0], b[1], z], [b[0], b[1], z - depth], [a[0], a[1], z - depth]], n, {}); }
    B.addWalkPoly(pts, z, mat);
    B.group = g;
  };
  const rect = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  // ground -> upper (carpet), 16 risers of 0.18
  const lsx = [7.93, 8.20, 8.47, 8.74, 9.01, 9.28];
  for (let i = 0; i < 5; i++) stepPrism(rect(lsx[i], lsx[i + 1], 19.06, 19.96), 0.18 * (i + 1), 0.30, 'carpet', 'ground');
  for (let k = 0; k < 6; k++) stepPrism(wpoly(k), 0.18 * (6 + k), 0.30, 'carpet', k < 3 ? 'ground' : 'upper');
  const lnx = [9.28, 9.01, 8.74, 8.47, 8.20];
  for (let i = 0; i < 4; i++) stepPrism(rect(lnx[i + 1], lnx[i], 18.06, 18.96), 0.18 * (12 + i), 0.30, 'carpet', 'upper');
  // basement -> ground (tiles), 14 risers of 0.185
  const bn = [8.40, 8.693, 8.987, 9.28];
  for (let i = 0; i < 3; i++) stepPrism(rect(bn[i], bn[i + 1], 18.06, 18.96), -0.185 * (i + 1), 0.30, 'bTile', 'basement');
  for (let k = 5; k >= 0; k--) { const zt = -0.185 * (4 + (5 - k)); stepPrism(wpoly(k), zt, zt - BF, 'bTile', 'basement'); }
  const bs = [9.28, 9.02, 8.76, 8.50, 8.24];
  for (let i = 0; i < 4; i++) { const zt = -0.185 * (10 + i); stepPrism(rect(bs[i + 1], bs[i], 19.06, 19.96), zt, zt - BF, 'bTile', 'basement'); }
  // sloped plaster soffits under the flights that have space beneath
  const soffit = (xa, za, xb, zb, y0, y1, grp) => { const g = B.group; B.group = grp; const n = [-(zb - za), 0, (xb - xa)]; const l = Math.hypot(...n);
    const N = [n[0] / l, 0, n[2] / l]; B.poly('plaster', [[xa, y0, za], [xb, y0, zb], [xb, y1, zb], [xa, y1, za]], N[2] < 0 ? N : N.map(v => -v), {}); B.group = g; };
  soffit(7.93, -0.13, 9.28, 0.77, 19.06, 19.96, 'ground');
  soffit(8.20, 2.39, 9.28, 1.67, 18.06, 18.96, 'upper');
  soffit(8.40, -0.49, 9.28, -1.045, 18.06, 18.96, 'basement');
  B.group = 'upper'; B.poly('plaster', [[8.20, 18.06, 2.39], [8.20, 18.96, 2.39], [8.20, 18.96, GC], [8.20, 18.06, GC]], [1, 0, 0], {});
  B.group = 'ground'; B.poly('plaster', [[8.40, 18.06, -0.49], [8.40, 18.96, -0.49], [8.40, 18.96, BC], [8.40, 18.06, BC]], [1, 0, 0], {});
  // stair handrail on the basement run (wall mounted)
  B.cylP([8.30, 19.93, BF + 0.95], [9.25, 19.93, -1.85 + 0.95], 0.02, 6, { mat: 'metal', col: '#555' });
  // stair gallery (frames on the north wall above the upper flight)
  B.group = 'upper';
  const gal = [[8.35, 8.75, 3.70, 4.20, 0], [8.35, 8.62, 3.28, 3.60, 9], [8.70, 8.95, 3.25, 3.60, 10], [8.85, 9.25, 3.95, 4.45, 1], [9.00, 9.30, 3.45, 3.85, 11],
    [9.35, 9.70, 3.70, 4.15, 2], [9.35, 9.62, 3.20, 3.58, 12], [9.72, 10.10, 3.30, 3.78, 6], [9.78, 10.12, 3.88, 4.30, 13], [8.80, 9.05, 2.95, 3.18, 14], [9.40, 9.66, 2.80, 3.08, 15]];
  for (const [a, b, z0, z1, c] of gal) picture(B, 'y', 18.06, 1, a, b, z0 - 0.35, z1 - 0.35, c, { frame: 0.022, mat0: 0.03 });
  for (const [a, b, z0, z1, c] of [[18.90, 19.15, 3.35, 3.62, 7], [19.20, 19.46, 3.35, 3.62, 8], [18.92, 19.30, 2.95, 3.25, 4], [19.35, 19.55, 2.98, 3.22, 3]]) picture(B, 'x', 10.23, -1, a, b, z0, z1, c, { frame: 0.02, mat0: 0.025 });
  // orchid on the stair window sill
  B.cone(10.18, 18.53, 2.49, 2.60, 0.05, 0.06, 8, { mat: 'paint', col: '#f0f0f0' });
  B.sph(10.16, 18.53, 2.72, 0.09, 0.14, 0.06, 6, { mat: 'foliage' });
  B.sph(10.14, 18.50, 2.92, 0.05, 0.05, 0.04, 6, { mat: 'paint', col: '#f3e6f0' });

  // =================== UPPER FLOOR ===================
  const uIn = (o) => Object.assign({ fz: U, cz: UC }, o || {});
  iw(B, 'y', 11.99, 12.17, 1.98, 9.86, U, 5.40, U, UC);
  iw(B, 'x', 5.98, 6.08, 12.17, 13.92, U, UC, U, UC);
  iw(B, 'y', 13.92, 14.02, 5.16, 6.74, U, UC, U, UC);
  iw(B, 'x', 5.16, 5.26, 14.02, 17.82, U, UC, U, UC, [{ a: 14.39, b: 15.27, zb: U, zt: U + 2.05 }, { a: 15.83, b: 16.70, zb: U, zt: U + 2.05 }]);
  doorTrim(B, 'x', 5.16, 5.26, 14.39, 15.27, U, 2.05); doorTrim(B, 'x', 5.16, 5.26, 15.83, 16.70, U, 2.05);
  iw(B, 'y', 15.32, 15.42, 1.98, 5.16, U, UC, U, UC);
  iw(B, 'y', 17.82, 18.07, 1.98, 5.26, U, UC, U, UC);
  iw(B, 'x', 5.16, 5.26, 18.07, 19.96, U, UC, U, UC, [{ a: 18.12, b: 18.87, zb: U, zt: U + 2.05 }]);
  doorTrim(B, 'x', 5.16, 5.26, 18.12, 18.87, U, 2.05);
  B.box(2.88, 2.98, 18.92, 19.96, U, U + 2.10, { mat: 'bathTile', collide: true });
  iw(B, 'x', 6.64, 6.74, 14.02, 17.82, U, UC, U, UC, [{ a: 14.39, b: 15.34, zb: U, zt: U + 2.05 }, { a: 16.22, b: 16.97, zb: U, zt: U + 2.05 }]);
  doorTrim(B, 'x', 6.64, 6.74, 14.39, 15.34, U, 2.05); doorTrim(B, 'x', 6.64, 6.74, 16.22, 16.97, U, 2.05);
  iw(B, 'y', 15.94, 16.04, 6.74, 9.86, U, UC, U, UC, [{ a: 7.00, b: 7.96, zb: U, zt: U + 2.42 }]); // bathroom cabinet recess
  iw(B, 'y', 17.82, 18.06, 6.64, 10.23, U, UC, U, UC);
  // chimney boxes
  B.box(4.51, 4.86, 12.17, 12.59, U, UC, { mat: 'plaster', collide: true, fz: U, cz: UC });
  B.box(4.47, 4.85, 19.72, 19.96, U, UC, { mat: 'plaster', collide: true, fz: U, cz: UC });
  // parapets + handrail caps
  B.box(7.60, 7.78, 18.96, 19.06, U, 3.88, { mat: 'plaster', collide: true });
  B.box(8.18, 8.28, 19.06, 19.96, U, 3.88, { mat: 'plaster', collide: true });
  B.box(7.57, 9.33, 18.93, 19.09, 3.88, 3.93, { mat: 'woodDark', col: '#5a3a2a' });
  B.box(8.15, 8.31, 19.09, 19.99, 3.88, 3.93, { mat: 'woodDark', col: '#5a3a2a' });
  // floors
  const uf = [[1.98, 5.16, 12.17, 15.32, 'carpet'], [5.16, 5.98, 12.17, 13.92, 'carpet'], [1.98, 5.16, 15.42, 17.82, 'carpet'], [1.98, 5.16, 18.07, 19.96, 'bathFloor'],
    [5.26, 6.64, 14.02, 18.06, 'carpet'], [5.26, 8.20, 18.06, 19.96, 'carpet'], [6.75, 8.165, 19.96, 20.96, 'carpet'], [6.08, 9.86, 12.17, 15.94, 'carpet'],
    [5.16, 5.26, 14.39, 15.27, 'carpet'], [5.16, 5.26, 15.83, 16.70, 'carpet'], [5.16, 5.26, 18.12, 18.87, 'bathFloor'], [6.64, 6.74, 14.39, 15.34, 'carpet']]; // bathroom floor: bathroom.js
  for (const [a, b, c, d, m] of uf) B.floor(a, b, c, d, U, m, { fz: U, cz: UC });
  B.group = 'roof';
  const ucs = [[1.98, 5.16, 12.17, 15.32], [5.16, 5.98, 12.17, 13.92], [1.98, 5.16, 15.42, 17.82], [1.98, 5.16, 18.07, 19.96], [5.26, 6.64, 14.02, 18.06],
    [5.26, 10.23, 18.06, 19.96], [6.08, 9.86, 12.17, 15.94], [6.74, 9.86, 16.04, 17.82]]; // alcove ceiling: see desk.js
  for (const [a, b, c, d] of ucs) B.ceil(a, b, c, d, UC, 'ceiling', { fz: U, cz: UC });
  // loft hatch
  B.box(5.40, 6.85, 18.80, 19.40, UC - 0.02, UC, { mat: 'woodLight', f: { zp: null } });
  B.group = 'upper';
  for (const [x, y, r] of [[3.4, 16.6, 0.16], [3.4, 19.0, 0.14], [5.95, 16.0, 0.13], [6.3, 19.0, 0.13], [8.3, 16.9, 0.14]]) lampCeil(B, x, y, UC, r);
  // front bedroom: furnished in kidsroom.js (radiator stays here)
  radiator(B, 'x', 1.98, 1, 13.35, 14.40, U + 0.12, U + 0.62);
  // small bedroom (daughter's room): furniture removed at the owner's request (curtains and radiator stay)
  // curtains that can be drawn across the window (15.67..16.87)
  B.mover({ scaleY: { pivot: 15.30, k: (16.27 - 15.30) / (15.72 - 15.30) }, link: 'sbCurt', label: 'curtains', verbs: ['Close', 'Open'], center: [2.05, 16.27, U + 1.5], reach: 1.9, cone: 0.6 }, (D) => curtain(D, 'x', 2.02, 15.30, 15.72, U + 0.05, U + 2.42));
  B.mover({ scaleY: { pivot: 17.25, k: (17.25 - 16.27) / (17.25 - 16.80) }, link: 'sbCurt', label: 'curtains', verbs: ['Close', 'Open'], center: [2.05, 16.27, U + 1.5], reach: 1.9, cone: 0.6 }, (D) => curtain(D, 'x', 2.02, 16.80, 17.25, U + 0.05, U + 2.42));
  radiator(B, 'x', 1.98, 1, 15.75, 16.80, U + 0.12, U + 0.62);
  // shower room
  B.box(1.98, 2.88, 18.95, 19.96, U, U + 0.06, { mat: 'gloss', col: '#f3f3f1' });
  B.poly('glass', [[1.98, 18.95, U + 0.06], [2.88, 18.95, U + 0.06], [2.88, 18.95, U + 2.05], [1.98, 18.95, U + 2.05]], [0, -1, 0], {});
  B.box(2.86, 2.88, 18.95, 18.97, U + 0.06, U + 2.05, { mat: 'metal', col: '#c0c3c5' });
  B.box(1.98, 1.985, 18.95, 19.96, U, U + 2.10, { mat: 'bathTile' });
  B.box(1.98, 2.88, 19.955, 19.96, U, U + 2.10, { mat: 'bathTile' });
  B.cylP([2.05, 19.45, U + 2.0], [2.25, 19.45, U + 2.0], 0.012, 6, { mat: 'metal', col: '#c9cccf' });
  B.cylZ(2.25, 19.45, U + 1.94, U + 2.0, 0.09, 12, { mat: 'metal', col: '#c9cccf' });
  B.addCollider(1.98, 2.88, 18.93, 18.97, U, U + 2.0);
  B.box(3.00, 3.62, 19.36, 19.95, U, U + 0.85, { mat: 'gloss', col: '#f5f5f3', collide: true });
  B.cylP([3.31, 19.355, U + 0.52], [3.31, 19.345, U + 0.52], 0.17, 16, { mat: 'gloss', col: '#3a3f44', caps: true });
  basin(B, 3.70, 4.40, 19.45, 19.95, U + 0.85, 'yn');
  mirror(B, 'y', 19.96, -1, 3.75, 4.35, U + 1.10, U + 1.85);
  B.box(3.00, 4.45, 19.955, 19.96, U, U + 1.30, { mat: 'bathTile' });
  radiator(B, 'x', 5.16, -1, 19.10, 19.70, U + 0.20, U + 1.40);
  // corridor: games shelf + mirror
  B.box(5.30, 6.60, 14.02, 14.34, U, U + 0.76, { mat: 'paint', col: '#f3f2ee', collide: true, f: { yp: 'games' }, uvf: { yp: [[0, 1], [1, 1], [1, 0], [0, 0]] } });
  mirror(B, 'y', 14.02, 1, 5.40, 6.50, U + 1.10, U + 1.80, '#9d9786');
  for (let i = 0; i < 6; i++) B.box(5.36 + i * 0.07, 5.42 + i * 0.07, 14.08, 14.30, U + 0.76, U + 0.80 + (i % 3) * 0.02, { mat: 'paint', col: ['#c0392b', '#2e86c1', '#f1c40f', '#27ae60', '#8e44ad', '#e67e22'][i] });
  picture(B, 'x', 5.26, 1, 16.95, 17.40, U + 1.20, U + 1.80, 8, { frame: 0.025, fcol: '#d9c9a4', mat0: 0.05 });
  // the desk alcove at the top of the stairs is built in desk.js
  // rear bedroom: built in bedroom.js
  // bathroom
  B.box(9.05, 9.84, 16.06, 17.80, U, U + 0.55, { mat: 'gloss', col: '#f7f7f5', collide: true });
  B.box(9.12, 9.77, 16.13, 17.73, U + 0.30, U + 0.551, { mat: 'gloss', col: '#dfe6ea' });
  // wall tiles, floor, built-in cabinet: bathroom.js
  B.cylP([9.80, 16.95, U + 0.95], [9.62, 16.95, U + 0.95], 0.015, 6, { mat: 'metal', col: '#c9cccf' });
  B.box(7.70, 8.95, 17.30, 17.82, U + 0.81, U + 0.85, { mat: 'gloss', col: '#f7f7f5' });
  cabinet(B, 7.72, 8.93, 17.32, 17.82, U + 0.25, U + 0.81, 'yn', { col: '#8b6f53', n: 2 });
  B.addCollider(7.70, 8.95, 17.30, 17.82, U, U + 0.85);
  B.cylZ(8.33, 17.56, U + 0.85, U + 0.97, 0.19, 16, { mat: 'gloss', col: '#f7f7f5' });
  B.cylZ(8.33, 17.56, U + 0.97, U + 0.975, 0.16, 16, { mat: 'gloss', col: '#dfe3e5' });
  B.cylZ(8.33, 17.78, U + 0.85, U + 1.07, 0.015, 8, { mat: 'metal', col: '#c9cccf' });
  mirror(B, 'y', 17.82, -1, 7.80, 8.85, U + 1.15, U + 2.00);
  toilet(B, 7.17, 17.82, [0, -1], U);
}

// Door definitions (our unit)
function buildDoors(B) {
  const { G, U, B: BF } = LV;
  const T = (id, label, group, hinge, closed, open, w, z0, h, o = {}) => doorLeaf(B, Object.assign({ id, label, group, hinge, closed, open, w, z0, h, mat: o.glass ? 'woodDark' : 'doorLeaf', startOpen: true }, o));
  // exterior
  T('front', 'Front door', 'ground', [2.83, 18.24], [0, 1], [1, 0], 0.90, 0.01, 2.13, { t: 0.06, ext: 1 });
  T('terrace', 'Street terrace door', 'ground', [1.74, 13.33], [0, 1], [1, 0], 0.86, 0.03, 2.27, { glass: true, t: 0.06 });
  T('garden', 'Garden door', 'ground', [8.72, 15.14], [0, -1], [-1, 0], 0.86, 0.03, 2.27, { glass: true, t: 0.06 });
  T('balcony', 'Balcony door', 'upper', [6.29, 20.22], [-1, 0], [0, -1], 0.95, U + 0.03, 2.02, { glass: true, t: 0.06 });
  // interior
  T('wc', 'WC door', 'ground', [4.985, 20.01], [1, 0], [0, -1], 0.69, 0.01, 2.02, { startOpen: false });
  T('pantry', 'Pantry door', 'ground', [7.675, 20.01], [-1, 0], [0, -1], 0.69, 0.01, 2.02, { startOpen: false });
  T('storage', 'Storage door', 'basement', [6.25, 18.45], [0, 1], [-1, 0], 0.82, BF + 0.01, 1.99);
  T('garagein', 'Garage door (inner)', 'basement', [6.58, 17.935], [1, 0], [0, 1], 0.84, BF + 0.01, 1.99);
  T('bed1', 'Front bedroom door', 'upper', [5.21, 15.24], [0, -1], [-1, 0], 0.82, U + 0.01, 2.02, { mat: 'doorWarm' });
  T('bed2', 'Small bedroom door', 'upper', [5.21, 15.86], [0, 1], [-1, 0], 0.81, U + 0.01, 2.02);
  T('bed3', 'Rear bedroom door', 'upper', [6.69, 15.31], [0, -1], [1, 0], 0.89, U + 0.01, 2.02, { mat: 'doorWarm' });
  T('bath', 'Bathroom door', 'upper', [6.69, 16.25], [0, 1], [1, 0], 0.69, U + 0.01, 2.02, { mat: 'doorWarm' });
  T('shower', 'Shower room door', 'upper', [5.21, 18.15], [0, 1], [-1, 0], 0.69, U + 0.01, 2.02);
  // garage (up-and-over sectional): special
  const D = new Builder(); D.group = 'basement'; D.collide = false;
  D.box(1.77, 1.83, 13.01, 17.42, -2.61, -0.53, { mat: 'garageDoor', ext: 1 });
  D.box(1.83, 1.86, 15.10, 15.35, -1.62, -1.58, { mat: 'metal', col: '#666' });
  B.doorDefs.push({ id: 'garage', label: 'Garage door', group: 'basement', builder: D, garage: true, startOpen: false, openAngle: Math.PI / 2,
    box: { x0: 1.74, x1: 1.86, y0: 13.01, y1: 17.42, z0: -2.61, z1: -0.53 }, center: [1.9, 15.2, -1.6] });
}
