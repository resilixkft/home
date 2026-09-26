// ---------- Site: terrain, street, planting, neighbours ----------
const SITE = { street: -11.3, rear: 26.0, sideY: 24.3 };
const HOLES = [ // plan rects (our half); mirrored copies added automatically
  [1.60, 8.86, 11.99, 17.81], [2.67, 8.545, 17.81, 20.34], [4.03, 8.545, 20.34, 21.34], [8.48, 10.53, 17.68, 20.34],
  [-8.90, 1.68, 12.41, 18.06], [-11.30, -8.90, 13.24, 17.24], [4.80, 5.86, 21.29, 21.73]
];
function inHole(x, y) {
  const yy = y < 11.988 ? MIRROR_Y - y : y;
  for (const h of HOLES) if (x > h[0] + 1e-4 && x < h[1] - 1e-4 && yy > h[2] + 1e-4 && yy < h[3] - 1e-4) return true;
  return false;
}
function terrainH(x, y) {
  let h = -0.66;
  if (x > 11.0) h -= (Math.min(x, 26) - 11.0) * 0.055;
  if (x > 26) h -= (x - 26) * 0.03;
  if (x < -11.3) h = x >= -12.5 ? -0.68 : x >= -12.65 ? -0.75 : x >= -21.0 ? -0.82 : x >= -22.4 ? -0.68 : -0.72;
  // gentle mound under the front conifers
  return h;
}
function rampH(x) { return x >= 0.40 ? -2.61 : x >= -1.60 ? -2.61 + (0.40 - x) * 0.10 : x >= -8.90 ? -2.41 + (-1.60 - x) * 0.20 : x >= -10.90 ? -0.95 + (-8.90 - x) * 0.10 : -0.75; }
function inRamp(x, y) { const yy = y < 11.988 ? MIRROR_Y - y : y; return (x > -11.3 && x < -8.9 && yy > 13.44 && yy < 17.04) || (x >= -8.9 && x < 1.70 && yy > 12.61 && yy < 17.86); }

function buildSite(B) {
  B.mirror = false; B.group = 'site'; B.extF = 1;
  // terrain grid
  const xs = new Set(), ys = new Set();
  for (let x = -60; x <= 80; x += (x < -14 || x > 30 ? 4 : 1)) xs.add(+x.toFixed(3));
  for (let y = -40; y <= 64; y += (y < -4 || y > 28 ? 4 : 1)) ys.add(+y.toFixed(3));
  for (const h of HOLES) { xs.add(h[0]); xs.add(h[1]); ys.add(h[2]); ys.add(h[3]); ys.add(+(MIRROR_Y - h[2]).toFixed(4)); ys.add(+(MIRROR_Y - h[3]).toFixed(4)); }
  for (const v of [-11.3, -12.5, 11.63, 11.988, 22.10, 1.68, -9.10]) xs.add(v);
  for (const v of [11.988, 24.3, -0.324, 22.10, MIRROR_Y - 22.10]) ys.add(v);
  const X = [...xs].sort((a, b) => a - b), Y = [...ys].sort((a, b) => a - b);
  for (let i = 0; i < X.length - 1; i++) for (let j = 0; j < Y.length - 1; j++) {
    const x0 = X[i], x1 = X[i + 1], y0 = Y[j], y1 = Y[j + 1], cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (inHole(cx, cy)) continue;
    if (cx < -11.3) continue; // sidewalk and road built separately
    B.poly('grass', [[x0, y0, terrainH(x0, y0)], [x1, y0, terrainH(x1, y0)], [x1, y1, terrainH(x1, y1)], [x0, y1, terrainH(x0, y1)]], [0, 0, 1], { ext: 1 });
  }
  // street: sidewalk + curb + road
  B.poly('concrete', [[-12.5, -40, -0.68], [-11.3, -40, -0.68], [-11.3, 64, -0.68], [-12.5, 64, -0.68]], [0, 0, 1], { ext: 1 });
  B.box(-12.65, -12.5, -40, 64, -0.82, -0.68, { mat: 'concrete', ext: 1 });
  B.poly('asphalt', [[-21, -40, -0.82], [-12.65, -40, -0.82], [-12.65, 64, -0.82], [-21, 64, -0.82]], [0, 0, 1], { ext: 1 });
  B.box(-21.15, -21.0, -40, 64, -0.82, -0.68, { mat: 'concrete', ext: 1 });
  B.poly('concrete', [[-22.4, -40, -0.68], [-21.15, -40, -0.68], [-21.15, 64, -0.68], [-22.4, 64, -0.68]], [0, 0, 1], { ext: 1 });
  B.poly('grass', [[-60, -40, -0.72], [-22.4, -40, -0.72], [-22.4, 64, -0.72], [-60, 64, -0.72]], [0, 0, 1], { ext: 1 });
  // road markings
  for (let y = -38; y < 62; y += 6) B.poly('paint', [[-16.9, y, -0.815], [-16.78, y, -0.815], [-16.78, y + 3, -0.815], [-16.9, y + 3, -0.815]], [0, 0, 1], { col: '#e9e6dc', ext: 1 });
  buildFrontFence(B);
  B.mirror = false; B.group = 'site';
  // our outer side boundary (on the right coming in through the gate): timber fence on a concrete plinth
  buildSideFence(B);
  B.mirror = false; B.group = 'site'; B.extF = 1;
  // side boundary hedge of the other half (thuja)
  B.box(-11.2, 26.0, MIRROR_Y - 24.75, MIRROR_Y - 24.05, -1.5, 1.85, { mat: 'foliage', ext: 1, collide: true });
  // rear boundary with Csaba's house: green welded-mesh fence along the full width of both back gardens
  buildRearFence(B);
  B.mirror = false; B.group = 'site'; B.extF = 1;
  // timber fence between the two back gardens, up to the rear fence
  B.box(11.82, 26.16, 11.95, 12.03, -1.6, 0.55, { mat: 'woodClad', ext: 1, collide: true });
  // privacy wall between the two rear terraces (shared)
  B.box(8.86, 11.82, 11.77, 12.21, -0.70, 2.52, { mat: 'woodClad', ext: 1, collide: true });
  // strip between the ramps
  B.box(-10.6, 0.3, 11.60, 12.38, -0.66, 0.1, { mat: 'foliage', ext: 1, collide: true });
  // trees
  const conifer = (x, y, h, r) => { const z = terrainH(x, y); B.cylZ(x, y, z, z + 1.2, 0.16, 7, { mat: 'trunk', ext: 1, collide: true });
    const n = 6; for (let k = 0; k < n; k++) { const f = k / n, zb = z + 0.8 + f * h * 0.78, rr = r * (1 - f * 0.85) * (0.9 + 0.2 * ((k * 7) % 3) / 2); B.cone(x, y, zb, zb + h * 0.30, rr, 0.03, 10, { mat: 'foliage', ext: 1, col: k % 2 ? '#e8f0e0' : '#ffffff' }); } };
  const cypress = (x, y, h, r) => { const z = terrainH(x, y); B.sph(x, y, z + h * 0.5, r, r, h * 0.52, 10, { mat: 'foliage', ext: 1, collide: true }); };
  const decid = (x, y, h, r) => { const z = terrainH(x, y); B.cylZ(x, y, z, z + h * 0.55, 0.16, 7, { mat: 'trunk', ext: 1, collide: true });
    for (const [dx, dy, dz, s] of [[0, 0, 0.72, 1], [0.35 * r, 0.2 * r, 0.6, 0.72], [-0.3 * r, -0.25 * r, 0.62, 0.75], [0.1 * r, -0.4 * r, 0.82, 0.6]])
      B.sph(x + dx, y + dy, z + h * dz, r * s, r * s, r * s * 0.85, 9, { mat: 'foliage', ext: 1 }); };
  const shrub = (x, y, r) => { const z = terrainH(x, y); B.sph(x, y, z + r * 0.6, r, r, r * 0.75, 7, { mat: 'foliage', ext: 1 }); };
  cypress(-0.9, 11.99, 6.2, 1.1);
  cypress(-1.0, 23.05, 5.4, 0.9); cypress(-1.0, MIRROR_Y - 23.05, 5.0, 0.85);
  conifer(-7.8, 2.6, 13, 2.6); conifer(-9.4, 23.1, 7.5, 1.0);
  decid(13.2, 23.0, 7.5, 2.4); decid(19.5, 19.0, 5.5, 2.0); decid(21.0, 5.5, 6.5, 2.3);
  conifer(24.0, 16.0, 9, 2.0); cypress(12.5, 11.2, 4.5, 0.9);
  for (const [x, y, r] of [[-4, 23.0, 0.6], [-6, 20.4, 0.8], [14, 23.3, 0.7], [17, 23.5, 0.8], [22, 23.2, 0.9], [15, 0.7, 0.8], [20, 0.9, 0.7], [11.9, 21.5, 0.5], [-9, 23.2, 0.9], [-9, 0.8, 0.9]]) shrub(x, y, r);
  // garden furniture on the rear terrace: corner sofa, dining set
  B.group = 'site';
  const T = -0.15;
  const sofaT = (x0, x1, y0, y1, back) => { const o = { mat: 'oak', col: '#d8b98f', ext: 1 };
    B.box(x0, x1, y0, y1, T, T + 0.30, o);
    B.box(x0 + 0.02, x1 - 0.02, y0 + 0.02, y1 - 0.02, T + 0.30, T + 0.45, { mat: 'fabric', col: '#f4f1ea', ext: 1 });
    if (back === 'xn') B.box(x0, x0 + 0.22, y0, y1, T + 0.45, T + 0.85, { mat: 'fabric', col: '#f4f1ea', ext: 1 });
    if (back === 'yp') B.box(x0, x1, y1 - 0.22, y1, T + 0.45, T + 0.85, { mat: 'fabric', col: '#f4f1ea', ext: 1 });
    B.addCollider(x0, x1, y0, y1, T, T + 0.85); };
  sofaT(8.92, 9.72, 15.35, 17.55, 'xn'); sofaT(9.72, 10.70, 16.80, 17.55, 'yp');
  B.box(10.10, 10.70, 15.60, 16.20, T + 0.35, T + 0.40, { mat: 'oak', col: '#b98a5a', ext: 1, collide: true });
  // dining table + folding chairs
  const tx0 = 9.55, tx1 = 10.45, ty0 = 12.75, ty1 = 13.95;
  B.box(tx0, tx1, ty0, ty1, T + 0.72, T + 0.76, { mat: 'oak', col: '#9c5f3a', ext: 1, collide: true });
  for (const [x, y] of [[tx0 + 0.05, ty0 + 0.05], [tx1 - 0.05, ty0 + 0.05], [tx0 + 0.05, ty1 - 0.05], [tx1 - 0.05, ty1 - 0.05]]) B.box(x - 0.025, x + 0.025, y - 0.025, y + 0.025, T, T + 0.72, { mat: 'oak', col: '#9c5f3a', ext: 1 });
  const fchair = (cx, cy, yaw) => { const o = { mat: 'oak', col: '#a9653c', ext: 1 }; const c = Math.cos(yaw), s = Math.sin(yaw);
    B.boxR(cx, cy, T + 0.44, 0.42, 0.42, 0.03, yaw, o);
    B.boxR(cx, cy, T + 0.47, 0.38, 0.36, 0.05, yaw, { mat: 'fabric', col: '#f2eee6', ext: 1 });
    const P = (lx, ly) => [cx + lx * c - ly * s, cy + lx * s + ly * c];
    for (const lx of [-0.19, 0.19]) { const a = P(lx, -0.2), b = P(lx, 0.2); B.cylP([a[0], a[1], T], [b[0], b[1], T + 0.9], 0.02, 5, o); B.cylP([b[0], b[1], T], [a[0], a[1], T + 0.44], 0.02, 5, o); }
    const bk = P(0, -0.18); B.boxR(bk[0], bk[1], T + 0.62, 0.40, 0.03, 0.25, yaw, o);
    B.addCollider(cx - 0.25, cx + 0.25, cy - 0.25, cy + 0.25, T, T + 0.9); };
  fchair(10.0, ty0 - 0.40, 0); fchair(10.0, ty1 + 0.40, Math.PI); fchair(tx1 + 0.40, 13.35, Math.PI / 2); fchair(tx0 - 0.40, 13.35, -Math.PI / 2);
  // potted plants by the WC volume & on the street terrace
  B.box(4.10, 6.30, 21.30, 21.85, -0.66, -0.58, { mat: 'fascia', ext: 1 });
  const pot = (x, y, z, r, h, col = '#b86b43') => { B.cone(x, y, z, z + h, r * 0.8, r, 10, { mat: 'paint', col, ext: 1 }); B.sph(x, y, z + h + r * 0.9, r * 1.2, r * 1.2, r * 1.3, 7, { mat: 'foliage', ext: 1 }); };
  pot(4.35, 21.55, -0.58, 0.16, 0.26); pot(5.05, 21.60, -0.58, 0.18, 0.30); pot(5.55, 21.55, -0.58, 0.15, 0.24); pot(6.05, 21.60, -0.58, 0.2, 0.3);
  pot(0.45, 12.70, -0.01, 0.2, 0.35); pot(0.40, 18.95, -0.01, 0.17, 0.3); pot(4.80, 21.05, 2.84, 0.14, 0.24, '#9a9a9a');
  // street-terrace bench
  B.box(0.30, 0.75, 16.95, 18.15, 0.40, 0.45, { mat: 'oak', col: '#8b5a3a', ext: 1, collide: true });
  for (const y of [17.0, 18.1]) B.box(0.30, 0.75, y - 0.03, y + 0.03, -0.01, 0.40, { mat: 'oak', col: '#6b4430', ext: 1 });
  // lawn edge path to the rear terrace steps
  B.poly('pavers', [[11.63, 18.06, -0.645], [12.40, 18.06, -0.645], [12.40, 22.10, -0.645 - 0.03], [11.63, 22.10, -0.645 - 0.03]], [0, 0, 1], { ext: 1 });
  // neighbouring houses for context (simple masses)
  const house = (x0, x1, y0, y1, h, ridgeAlongY = true, wall = '#e9e3d8', roofCol = '#8a4b35') => {
    const z0 = -1.2; B.box(x0, x1, y0, y1, z0, h, { mat: 'render', col: wall, ext: 1, collide: true });
    const zr = h + (ridgeAlongY ? (x1 - x0) : (y1 - y0)) * 0.35;
    if (ridgeAlongY) { const xm = (x0 + x1) / 2; B.prismY([[x0 - 0.4, h - 0.2], [x1 + 0.4, h - 0.2], [xm, zr]], y0 - 0.3, y1 + 0.3, { mat: 'roofRed', col: roofCol, ext: 1, f: { yn: 'render', yp: 'render' } }); }
    else { const ym = (y0 + y1) / 2; B.prismX([[y0 - 0.4, h - 0.2], [y1 + 0.4, h - 0.2], [ym, zr]], x0 - 0.3, x1 + 0.3, { mat: 'roofRed', col: roofCol, ext: 1, f: { xn: 'render', xp: 'render' } }); }
    // dark window bands
    for (let z = 1.0; z < h - 0.5; z += 2.8) for (let x = x0 + 1.2; x < x1 - 1; x += 2.4) {
      B.box(x, x + 1.1, y1, y1 + 0.02, z, z + 1.3, { mat: 'glassNb', ext: 1 }); B.box(x, x + 1.1, y0 - 0.02, y0, z, z + 1.3, { mat: 'glassNb', ext: 1 }); }
  };
  house(0, 11, 34, 43, 5.2, true); house(-1, 10, -19, -10, 5.6, true, '#efe8da', '#6f3b2c'); house(-34, -25, 4, 13, 5.0, false, '#e3ddd1'); house(-34, -25, 17, 27, 5.4, false, '#f0ebe0', '#5b3a2e');
  buildRearHouse(B);
  B.mirror = false; B.group = 'site'; B.extF = 1;
  // distant tree line
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = 46 + (i % 3) * 5, x = 8 + Math.cos(a) * r, y = 12 + Math.sin(a) * r;
    if (x < -22 && x > -60 && Math.abs(y - 12) < 30) continue; (i % 2 ? decid : conifer)(x, y, 9 + (i % 4) * 2, 3 + (i % 3)); }
}

// ---------- House no. 24 on the street behind (a draft from the photos, placed from the site map) ----------
// Two storeys of cream render over an orange brick plinth, a hipped clay-tile roof with solar panels and roof
// windows, brown timber eaves and copper gutters. It stands behind our neighbour's half: a main block at about
// 32 degrees to our plot, with its terrace and long balcony facing our garden, and a wing whose end wall faces
// our rear hedge square-on, 6 m from it. The garden front bends where the wing meets the main block.
function buildRearHouse(B) {
  B.mirror = false; B.group = 'site'; B.extF = 1;
  const Z0 = -1.72, ZB = Z0 - 1.0, EAVE = Z0 + 6.0, PLINTH = Z0 + 0.95, FL1 = Z0 + 3.0;
  const X0 = 32.2;                                                // wing end wall: our rear hedge is centred on x = 26.2
  const uM = [0.8485, 0.5294], nM = [-0.5294, 0.8485], vM = [0.5294, -0.8485]; // along the garden front from the bend, out of it, into the house
  const LM = 13.07, DM = 7.67;                                    // main block (site map)
  const BL = [X0 + 3.62, 10.72];                                  // where the garden front bends
  const WG = { x0: X0, x1: X0 + 6.93, y0: 3.11, y1: BL[1] };      // wing (its end wall faces our hedge)
  const FAR = [BL[0] + uM[0] * LM, BL[1] + uM[1] * LM], TL = [BL[0] + vM[0] * DM, BL[1] + vM[1] * DM];
  const F = { main: { o: BL, d: uM, n: nM }, end: { o: [X0, WG.y1], d: [0, -1], n: [-1, 0] }, east: { o: FAR, d: vM, n: uM },
    wingG: { o: [X0, WG.y1], d: [1, 0], n: [0, 1] }, street: { o: TL, d: uM, n: vM }, wingS: { o: [X0, WG.y0], d: [1, 0], n: [0, -1] } };
  const wallO = { mat: 'render', col: '#fbefdb', ext: 1 }, brickO = { mat: 'brick', ext: 1 };
  const frameO = { mat: 'oak', col: '#b9895f', ext: 1 }, glassO = { mat: 'glassNb', ext: 1 }, sillO = { mat: 'stoneCap', ext: 1 };
  const copper = { mat: 'zinc', col: '#a4623c', ext: 1 }, lampO = { mat: 'zinc', col: '#26282a', ext: 1 };
  // a box standing on a face: s0..s1 along it, z0..z1, off0..off1 out from the wall
  const onFace = (f, s0, s1, z0, z1, off0, off1, o) => { const sm = (s0 + s1) / 2, om = (off0 + off1) / 2;
    B.boxR(f.o[0] + f.d[0] * sm + f.n[0] * om, f.o[1] + f.d[1] * sm + f.n[1] * om, z0, s1 - s0, off1 - off0, z1 - z0, Math.atan2(f.d[1], f.d[0]), o); };
  const win = (f, s, w, z0, h, o = {}) => {
    onFace(f, s - w / 2, s + w / 2, z0, z0 + h, -0.02, 0.035, frameO);
    onFace(f, s - w / 2 + 0.07, s + w / 2 - 0.07, z0 + 0.07, z0 + h - 0.07, 0.035, 0.04, glassO);
    for (const m of (o.mull || [])) onFace(f, s - w / 2 + m * w - 0.035, s - w / 2 + m * w + 0.035, z0 + 0.07, z0 + h - 0.07, 0.035, 0.05, frameO);
    if (!o.door) onFace(f, s - w / 2 - 0.05, s + w / 2 + 0.05, z0 - 0.05, z0, -0.02, 0.10, sillO);
    if (o.box) { onFace(f, s - w / 2 + 0.06, s + w / 2 - 0.06, z0 - 0.02, z0 + 0.17, 0.04, 0.24, { mat: 'paint', col: '#b86a45', ext: 1 });
      onFace(f, s - w / 2 + 0.09, s + w / 2 - 0.09, z0 + 0.17, z0 + 0.34, 0.06, 0.22, { mat: 'foliage', ext: 1 }); }
  };
  const lamp = (f, s, z) => onFace(f, s - 0.08, s + 0.08, z, z + 0.30, 0, 0.20, lampO);
  // masses: render walls over a brick plinth
  const mC = [BL[0] + uM[0] * LM / 2 + vM[0] * DM / 2, BL[1] + uM[1] * LM / 2 + vM[1] * DM / 2], yM = Math.atan2(uM[1], uM[0]);
  B.boxR(mC[0], mC[1], ZB, LM, DM, EAVE - ZB, yM, wallO); B.box(WG.x0, WG.x1, WG.y0, WG.y1, ZB, EAVE, wallO);
  B.boxR(mC[0], mC[1], ZB, LM + 0.04, DM + 0.04, PLINTH - ZB, yM, brickO); B.box(WG.x0 - 0.02, WG.x1, WG.y0 - 0.02, WG.y1 + 0.02, ZB, PLINTH, brickO);
  // garden front (measured from the bend): terrace bays under the balcony by the bend, a plain bay at the far end
  const M = F.main, P = (s, off) => [M.o[0] + M.d[0] * s + M.n[0] * off, M.o[1] + M.d[1] * s + M.n[1] * off];
  win(M, 7.3, 2.4, Z0 + 0.12, 2.33, { door: true, mull: [0.5] }); win(M, 3.2, 1.8, Z0 + 0.12, 2.33, { door: true, mull: [0.5] });
  onFace(M, 4.1, 6.1, ZB, FL1 - 0.2, -0.02, 0.03, brickO);
  const dc = P(5.1, 0.03); B.cylP([dc[0], dc[1], Z0 + 1.75], [dc[0] + M.n[0] * 0.04, dc[1] + M.n[1] * 0.04, Z0 + 1.75], 0.23, 14, { mat: 'paint', col: '#1d2126', ext: 1, caps: true }); // dartboard
  win(M, 7.2, 2.2, FL1, 2.3, { door: true, mull: [1 / 3, 2 / 3] }); win(M, 3.25, 1.7, FL1, 2.3, { door: true, mull: [0.5] }); win(M, 1.1, 1.0, FL1 + 0.9, 1.4);
  lamp(M, 11.9, Z0 + 2.2); lamp(M, 9.8, Z0 + 2.2); lamp(M, 5.1, FL1 + 2.0);
  // balcony: cream slab, dark railing
  onFace(M, 0, 8.8, FL1 - 0.2, FL1, 0, 1.3, wallO);
  const rail = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), nn = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L, 0];
    B.poly('fence', [[a[0], a[1], FL1], [b[0], b[1], FL1], [b[0], b[1], FL1 + 1.0], [a[0], a[1], FL1 + 1.0]], nn, { ext: 1, uvs: [[0, 1.25], [L, 1.25], [L, 0], [0, 0]] }); };
  rail(P(0.05, 1.25), P(8.75, 1.25)); rail(P(0.05, 0), P(0.05, 1.25)); rail(P(8.75, 0), P(8.75, 1.25));
  // terrace paving, a table with chairs and a bench
  onFace(M, 0.2, 9.8, Z0 - 0.8, Z0 + 0.12, 0, 4.0, { mat: 'balconyTile', col: '#efe3cf', ext: 1 });
  const wood = { mat: 'oak', col: '#7a4b30', ext: 1 };
  onFace(M, 0.6, 2.4, Z0 + 0.84, Z0 + 0.88, 1.9, 2.8, { mat: 'fabric', col: '#e9d6d6', ext: 1 }); onFace(M, 1.4, 1.6, Z0 + 0.12, Z0 + 0.84, 2.25, 2.45, wood);
  for (const s of [0.9, 1.5, 2.1]) for (const off of [1.45, 3.25]) { onFace(M, s - 0.22, s + 0.22, Z0 + 0.12, Z0 + 0.58, off - 0.2, off + 0.2, wood);
    const bo = off < 2 ? off - 0.2 : off + 0.12; onFace(M, s - 0.22, s + 0.22, Z0 + 0.58, Z0 + 1.05, bo, bo + 0.08, wood); }
  onFace(M, 6.4, 8.0, Z0 + 0.12, Z0 + 0.55, 1.0, 1.55, wood); onFace(M, 6.4, 8.0, Z0 + 0.55, Z0 + 0.95, 0.95, 1.05, wood);
  // the wing's end wall facing our hedge: two windows up, two with flower boxes down (measured from the garden corner)
  const E = F.end;
  for (const s of [1.9, 3.4]) { win(E, s, 1.0, FL1 + 0.9, 1.4); win(E, s, 1.0, PLINTH, 1.5, { box: true }); }
  lamp(E, 5.3, Z0 + 2.3);
  // the far end: three windows on each floor, flower boxes on the two by the garden
  const X = F.east;
  for (const [s, bx] of [[2.0, true], [3.85, true], [5.8, false]]) { win(X, s, 0.9, FL1 + 0.9, 1.4); win(X, s, 0.9, PLINTH, 1.5, { box: bx }); }
  lamp(X, 0.8, Z0 + 2.2);
  // the wing's short garden side, and the street side
  win(F.wingG, 1.8, 1.0, FL1 + 0.9, 1.4); win(F.wingG, 1.8, 1.0, PLINTH, 1.5);
  for (const s of [3.0, 6.5, 10.0]) { win(F.street, s, 1.0, FL1 + 0.9, 1.4); win(F.street, s, 1.0, PLINTH, 1.5); }
  for (const s of [1.8, 4.2]) { win(F.wingS, s, 0.9, FL1 + 0.9, 1.4); win(F.wingS, s, 0.9, PLINTH, 1.5); }
  // downpipes
  const pipe = (p) => B.cylZ(p[0], p[1], ZB, EAVE, 0.05, 8, copper);
  pipe(P(9.0, 0.08)); pipe([X0 - 0.08, WG.y1 + 0.08]); pipe([X0 - 0.08, WG.y0 - 0.08]); pipe([FAR[0] + uM[0] * 0.08 + nM[0] * 0.08, FAR[1] + uM[1] * 0.08 + nM[1] * 0.08]);
  // hipped roofs over the main block and the wing (their overlap makes the valley), timber soffits, copper gutters
  const pitch = Math.tan(38 * Math.PI / 180), OV = 0.8, roofO = { mat: 'clayRoof', col: '#f2d2c0', ext: 1 }, soffitO = { mat: 'oak', col: '#a8744a', ext: 1 };
  // hip roof over a rectangle (L along yaw, W across, L >= W) with its overhang; trim: gutter ends to leave out, per side
  const hip = (cx, cy, yaw, L, W, dz, trim = {}) => {
    const c = Math.cos(yaw), s = Math.sin(yaw); L += 2 * OV; W += 2 * OV;
    const H = W / 2 * pitch, r = (L - W) / 2, z = EAVE, zr = EAVE + H;
    const Q = (a, b, zz) => [cx + a * c - b * s, cy + a * s + b * c, zz];
    const up = (p0, p1, p2) => { const u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], v = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const l = Math.hypot(...n); n = n.map(t => t / l); return n[2] < 0 ? n.map(t => -t) : n; };
    for (const f of [[Q(-L / 2, -W / 2, z), Q(L / 2, -W / 2, z), Q(r, 0, zr), Q(-r, 0, zr)], [Q(L / 2, W / 2, z), Q(-L / 2, W / 2, z), Q(-r, 0, zr), Q(r, 0, zr)],
      [Q(-L / 2, W / 2, z), Q(-L / 2, -W / 2, z), Q(-r, 0, zr)], [Q(L / 2, -W / 2, z), Q(L / 2, W / 2, z), Q(r, 0, zr)]]) B.poly(roofO.mat, f, up(f[0], f[1], f[2]), roofO);
    B.poly(soffitO.mat, [Q(-L / 2, -W / 2, z - dz), Q(L / 2, -W / 2, z - dz), Q(L / 2, W / 2, z - dz), Q(-L / 2, W / 2, z - dz)], [0, 0, -1], soffitO);
    for (const [k, alongA, fixed, half] of [['b0', true, -W / 2, L / 2], ['b1', true, W / 2, L / 2], ['a0', false, -L / 2, W / 2], ['a1', false, L / 2, W / 2]]) {
      const [t0, t1] = trim[k] || [0, 0]; if (t0 + t1 >= 2 * half) continue;
      const m = (t0 - t1) / 2, len = 2 * half - t0 - t1, p = alongA ? Q(m, fixed, 0) : Q(fixed, m, 0);
      B.boxR(p[0], p[1], z - 0.13 - dz, len + 0.05, 0.12, 0.15, alongA ? yaw : yaw + Math.PI / 2, copper); }
    return { Q, H, L, W };
  };
  // the two eaves meet in front of the bend: gutters stop there; the main roof's end over the wing has none
  const tI = (OV - OV * nM[1]) / uM[1], Ix = BL[0] + OV * nM[0] + tI * uM[0], wcx = (WG.x0 + WG.x1) / 2, wW = WG.x1 - WG.x0;
  const RM = hip(mC[0], mC[1], yM, LM, DM, 0, { a0: [99, 99], b1: [tI + OV, 0] });
  hip(wcx, (WG.y0 + WG.y1) / 2, Math.PI / 2, WG.y1 - WG.y0, wW, 0.02, { a1: [(wcx - Ix) + wW / 2 + OV, 0] });
  // solar panels and roof windows on the garden slope of the main roof (its +b side faces the garden)
  const slope = (a, t, lift) => { const p = RM.Q(a, RM.W / 2 * (1 - t), EAVE + RM.H * t), k = lift / Math.hypot(1, pitch);
    return [p[0] + nM[0] * k * pitch, p[1] + nM[1] * k * pitch, p[2] + k]; };
  const slopeN = [nM[0] * pitch / Math.hypot(1, pitch), nM[1] * pitch / Math.hypot(1, pitch), 1 / Math.hypot(1, pitch)];
  for (const [t0, t1, a0, a1] of [[0.06, 0.349, -5.3, 5.3], [0.36, 0.649, -3.9, 3.9], [0.66, 0.949, -2.5, 2.5]])
    B.poly('solar', [slope(a0, t0, 0.05), slope(a1, t0, 0.05), slope(a1, t1, 0.05), slope(a0, t1, 0.05)], slopeN, { ext: 1, uvs: [[a0, 1.7], [a1, 1.7], [a1, 0], [a0, 0]] });
  for (const [a, t] of [[2.5, 0.505], [0.2, 0.505], [-2.1, 0.505], [0.9, 0.80], [-3.7, 0.205]])
    B.poly('metal', [slope(a - 0.39, t - 0.095, 0.08), slope(a + 0.39, t - 0.095, 0.08), slope(a + 0.39, t + 0.095, 0.08), slope(a - 0.39, t + 0.095, 0.08)], slopeN, { col: '#9fa9b2', ext: 1 });
}

// ---------- Side boundary fence (from the photos) ----------
// Grey concrete block plinth with a rounded coping, dark steel posts and angle rails with a bolt per board,
// weathered red-brown vertical boards with uneven tops. Runs along our outer side from the street pier to the
// rear hedge; plinth and panels step down with the garden.
function buildSideFence(B) {
  B.mirror = false; B.group = 'site'; B.extF = 1;
  const R = rng(4242);
  const xA = -11.07, xB = 25.80;           // street brick pier .. rear hedge
  const pY0 = 24.08, pY1 = 24.32;          // plinth, our face .. neighbour's face
  const postY0 = 24.14, postY1 = 24.20;    // 60 mm square posts on our side of the boards
  const railY = 24.200, bY0 = 24.207, bY1 = 24.229; // angle rails behind the posts, 22 mm boards behind the rails
  const PL = 0.40, CAP = 0.07, HT = 1.66;  // plinth above our ground, rounded coping, fence above the plinth
  const cutZ = (x) => terrainH(x, 24.2) + PL + 1.62; // straight top line of the boards, parallel to the ground
  const frame = { mat: 'zinc', col: '#2e2722', ext: 1 };
  const boardCols = ['#ffffff', '#f6e8de', '#eadbd0', '#fff4ec', '#e2dace', '#d9cabd', '#efe4d6', '#e4e0d0'];
  const n = Math.max(1, Math.round((xB - xA) / 2.25)), pitch = (xB - xA - 0.06) / n;
  const postX = []; for (let i = 0; i <= n; i++) postX.push(xA + 0.03 + i * pitch);
  const top = []; for (let i = 0; i < n; i++) top.push(terrainH((postX[i] + postX[i + 1]) / 2, 24.2) + PL);
  const capProfile = (zb) => { const pts = [], hw = (pY1 - pY0) / 2 + 0.004, yc = (pY0 + pY1) / 2;
    for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI, ca = Math.cos(a), sa = Math.sin(a);
      pts.push([yc + hw * Math.sign(ca) * Math.pow(Math.abs(ca), 0.55), zb + CAP * Math.pow(sa, 0.55)]); }
    return pts; };
  const bolt = (bx, zc) => { const pts = []; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; pts.push([bx + Math.cos(a) * 0.0075, railY - 0.0012, zc + Math.sin(a) * 0.0075]); }
    B.poly('zinc', pts, [0, -1, 0], { col: '#a59d87', ext: 1 }); };
  for (let i = 0; i < n; i++) {
    // plinth: blocks laid from the coping down, so the courses read right on every step
    const x0 = i === 0 ? xA : postX[i], x1 = i === n - 1 ? xB : postX[i + 1], zt = top[i], zc = zt - CAP;
    const zg = Math.min(terrainH(x0, 24.2), terrainH(x1, 24.2)) - 0.25, dv = zc - zg;
    B.box(x0, x1, pY0, pY1, zg, zc, { mat: 'plinthBlock', ext: 1, f: { zp: null, zn: null },
      uvf: { yn: [[-x0, dv], [-x1, dv], [-x1, 0], [-x0, 0]], yp: [[x0, dv], [x1, dv], [x1, 0], [x0, 0]] } });
    B.prismX(capProfile(zc), x0, x1, { mat: 'concrete', col: '#e6e2d8', ext: 1 });
    B.addCollider(x0, x1, pY0, pY1, zg, zt + HT);
    // angle rails: upright leg behind the posts, top leg towards us
    const a = postX[i] + 0.03, b = postX[i + 1] - 0.03, rails = [zt + 0.13, zt + 1.455];
    for (const zr of rails) { B.box(a, b, railY, railY + 0.006, zr, zr + 0.045, frame); B.box(a, b, railY - 0.03, railY, zr + 0.040, zr + 0.045, frame); }
    // boards: 10-14 cm wide with 2.5-4.5 cm gaps, uneven bottoms, the odd one a little out of true;
    // tops cut to one straight line a constant height above the ground (level at the front, following the slope at the back)
    const list = []; let s = 0;
    for (;;) { const g = 0.025 + R() * 0.02, w = 0.10 + R() * 0.04; if (s + g + w + 0.03 > b - a) break; list.push([s + g, w]); s += g + w; }
    const k = (b - a) / (s + 0.03);
    for (const [o, w] of list) {
      const xa = a + o * k, xb = xa + w * k, zb0 = zt + 0.02 + R() * 0.05, zb1 = zb0 + (R() - 0.5) * 0.02;
      R(); const lean = R() < 0.3 ? (R() - 0.5) * 0.024 : 0; R(); R(); // (random draws kept so the board layout is unchanged)
      B.prismY([[xa, zb0], [xb, zb1], [xb + lean, cutZ(xb + lean)], [xa + lean, cutZ(xa + lean)]], bY0, bY1,
        { mat: 'fenceBoard', col: boardCols[(R() * boardCols.length) | 0], ext: 1 });
      for (const zr of rails) bolt((xa + xb) / 2, zr + 0.02);
    }
  }
  // posts, bedded in the coping; where the plinth steps they run from the lower step to the higher rail
  for (let i = 0; i <= n; i++) {
    const tl = top[Math.max(0, i - 1)], tr = top[Math.min(n - 1, i)], x = postX[i];
    const zb = Math.min(tl, tr) - CAP - 0.02, zt = Math.max(tl, tr) + 1.50;
    B.box(x - 0.03, x + 0.03, postY0, postY1, zb, zt, frame);
    B.box(x - 0.034, x + 0.034, postY0 - 0.004, postY1 + 0.004, zt, zt + 0.006, frame);
  }
  // short end bay from the last post to the rear boundary fence (its own random draws, so the bays above stay as they are)
  const xE = 26.16, zt = top[n - 1], a = postX[n] + 0.03, R2 = rng(4243);
  if (xE > xB + 0.05) {
    const zc = zt - CAP, zg = terrainH(xE, 24.2) - 0.25, dv = zc - zg;
    B.box(xB, xE, pY0, pY1, zg, zc, { mat: 'plinthBlock', ext: 1, f: { zp: null, zn: null },
      uvf: { yn: [[-xB, dv], [-xE, dv], [-xE, 0], [-xB, 0]], yp: [[xB, dv], [xE, dv], [xE, 0], [xB, 0]] } });
    B.prismX(capProfile(zc), xB, xE, { mat: 'concrete', col: '#e6e2d8', ext: 1 });
    B.addCollider(xB, xE, pY0, pY1, zg, zt + HT);
    const rails = [zt + 0.13, zt + 1.455];
    for (const zr of rails) { B.box(a, xE, railY, railY + 0.006, zr, zr + 0.045, frame); B.box(a, xE, railY - 0.03, railY, zr + 0.040, zr + 0.045, frame); }
    let xa = a + 0.03;
    while (xa + 0.10 < xE - 0.02) {
      const xb = Math.min(xa + 0.10 + R2() * 0.03, xE - 0.02), zb0 = zt + 0.02 + R2() * 0.05;
      B.prismY([[xa, zb0], [xb, zb0], [xb, cutZ(xb)], [xa, cutZ(xa)]], bY0, bY1, { mat: 'fenceBoard', col: boardCols[(R2() * boardCols.length) | 0], ext: 1 });
      for (const zr of rails) bolt((xa + xb) / 2, zr + 0.02);
      xa = xb + 0.03 + R2() * 0.015;
    }
  }
}

// ---------- Rear boundary: green welded-mesh ("Euro") panel fence ----------
// 2.5 m panels, 1.53 m high with two V-bends, on 60 x 40 mm green posts with black caps. It runs the full width
// of both back gardens, from the other half's side hedge to our timber side fence, and can be seen through.
function buildRearFence(B) {
  B.mirror = false; B.group = 'site'; B.extF = 1;
  const X = 26.2, y0 = MIRROR_Y - 24.4, y1 = 24.2, PH = 1.53, gap = 0.05, bends = [0.38, 1.08], bh = 0.05, bd = 0.035;
  const zg = terrainH(X, 12), green = { mat: 'paint', col: '#1f5a3a', ext: 1 }, cap = { mat: 'paint', col: '#1b1d1e', ext: 1 };
  const n = Math.max(1, Math.round((y1 - y0) / 2.5)), pitch = (y1 - y0) / n;
  // one panel between two post faces: straight runs plus the two V-bends pushed out towards Csaba's side
  const panel = (ya, yb) => {
    const q = (h0, h1, d0, d1) => B.poly('euroMesh', [[X + d0, ya, zg + gap + h0], [X + d0, yb, zg + gap + h0], [X + d1, yb, zg + gap + h1], [X + d1, ya, zg + gap + h1]],
      [1, 0, 0], { ext: 1, uvs: [[ya, PH - h0], [yb, PH - h0], [yb, PH - h1], [ya, PH - h1]] });
    let h = 0;
    for (const b of bends) { q(h, b - bh, 0, 0); q(b - bh, b, 0, bd); q(b, b + bh, bd, 0); h = b + bh; }
    q(h, PH, 0, 0);
  };
  for (let i = 0; i <= n; i++) {
    const y = y0 + i * pitch;
    B.box(X - 0.02, X + 0.02, y - 0.03, y + 0.03, zg - 0.4, zg + gap + PH + 0.03, green);
    B.box(X - 0.025, X + 0.025, y - 0.035, y + 0.035, zg + gap + PH + 0.03, zg + gap + PH + 0.05, cap);
    if (i < n) panel(y + 0.03, y + pitch - 0.03);
  }
  B.addCollider(X - 0.06, X + 0.06, y0 - 0.03, y1 + 0.03, zg - 0.4, zg + gap + PH + 0.05);
}

// ---------- Street fence and entrance (from the photos): brick + blue concrete, dark timber gates ----------
function slatPanel(B, xc, a, b, z0, z1, o = {}) {
  // horizontal dark timber slats in a dark steel frame, panel in the plane x = xc, spanning y a..b
  const fr = 0.04, t = o.t || 0.035, sl = 0.12, gap = 0.036, fcol = '#2a231f';
  const x0 = xc - t / 2, x1 = xc + t / 2;
  B.box(x0 - 0.005, x1 + 0.005, a, a + fr, z0, z1, { mat: 'metal', col: fcol, ext: 1 });
  B.box(x0 - 0.005, x1 + 0.005, b - fr, b, z0, z1, { mat: 'metal', col: fcol, ext: 1 });
  B.box(x0 - 0.005, x1 + 0.005, a + fr, b - fr, z1 - fr, z1, { mat: 'metal', col: fcol, ext: 1 });
  B.box(x0 - 0.005, x1 + 0.005, a + fr, b - fr, z0, z0 + fr, { mat: 'metal', col: fcol, ext: 1 });
  for (const m of (o.mid || [])) B.box(x0 - 0.005, x1 + 0.005, m - 0.02, m + 0.02, z0 + fr, z1 - fr, { mat: 'metal', col: fcol, ext: 1 });
  let z = z1 - fr - 0.012;
  while (z - sl > z0 + fr + 0.01) { B.box(x0, x1, a + fr, b - fr, z - sl, z, { mat: 'slatWood', ext: 1 }); z -= sl + gap; }
}
function brickPier(B, x0, x1, y0, y1, zTop, cap = true) {
  B.box(x0, x1, y0, y1, -0.70, -0.08, { mat: 'blueConcrete', ext: 1, collide: true });
  B.box(x0, x1, y0, y1, -0.08, zTop, { mat: 'brick', ext: 1, collide: true });
  if (cap) B.box(x0 - 0.03, x1 + 0.03, y0 - 0.03, y1 + 0.03, zTop, zTop + 0.06, { mat: 'stoneCap', ext: 1 });
}
function buildFrontFence(B) {
  B.group = 'site'; B.extF = 1;
  // shared middle wall, centred on the party line: blue concrete plinth, klinker brick, concrete coping
  B.mirror = false;
  B.box(-11.45, -11.15, 10.536, 13.44, -0.70, -0.05, { mat: 'blueConcrete', ext: 1, collide: true });
  B.box(-11.45, -11.15, 10.536, 13.44, -0.05, 1.45, { mat: 'brick', ext: 1, collide: true });
  B.box(-11.49, -11.11, 10.50, 13.48, 1.45, 1.53, { mat: 'coping', ext: 1 });
  for (const nb of [false, true]) {
    B.mirror = nb;
    // gate track and pavement apron with drainage channel in front of the car gate
    B.box(-11.07, -11.03, 10.60, 17.04, -0.68, -0.655, { mat: 'metal', col: '#5b5d5f', ext: 1 });
    B.poly('pavers', [[-12.50, 13.44, -0.677], [-11.30, 13.44, -0.677], [-11.30, 18.34, -0.677], [-12.50, 18.34, -0.677]], [0, 0, 1], { ext: 1 });
    B.poly('grate', [[-12.32, 13.44, -0.674], [-12.16, 13.44, -0.674], [-12.16, 17.04, -0.674], [-12.32, 17.04, -0.674]], [0, 0, 1], { ext: 1 });
    // blue concrete gate post with pale cap, card reader
    B.box(-11.45, -11.15, 17.04, 17.34, -0.70, 1.25, { mat: 'blueConcrete', ext: 1, collide: true });
    B.box(-11.48, -11.12, 17.01, 17.37, 1.25, 1.31, { mat: 'stoneCap', ext: 1 });
    B.box(-11.47, -11.45, 17.14, 17.24, -0.12, 0.04, { mat: 'metal', col: '#151515', ext: 1 });
    B.box(-11.16, -11.05, 17.10, 17.28, 1.14, 1.18, { mat: 'metal', col: '#6d5a48', ext: 1 });
    // brick post with house number, intercom and letter slot; carries the entrance canopy
    brickPier(B, -11.52, -11.07, 18.34, 18.89, 1.80, false);
    B.box(-11.535, -11.52, 18.45, 18.78, 1.00, 1.15, { mat: nb ? 'metal' : 'plate', col: nb ? '#b08a3e' : undefined, ext: 1, uvf: nb ? undefined : { xn: [[0, 1], [1, 1], [1, 0], [0, 0]] } });
    B.box(-11.54, -11.52, 18.55, 18.68, 0.62, 0.92, { mat: 'metal', col: '#5e6163', ext: 1 });
    B.box(-11.545, -11.54, 18.58, 18.65, 0.80, 0.88, { mat: 'metal', col: '#202326', ext: 1 });
    B.box(-11.55, -11.52, 18.48, 18.75, 0.40, 0.52, { mat: 'metal', col: '#161616', ext: 1 });
    // entrance canopy: thin concrete slab with dark metal edge, on the brick post and a steel post
    B.box(-12.05, -10.80, 16.85, 19.30, 1.80, 1.92, { mat: 'coping', ext: 1 });
    B.box(-12.07, -10.78, 16.83, 19.32, 1.92, 1.95, { mat: 'metal', col: '#2c2f32', ext: 1 });
    B.cylZ(-11.30, 17.19, 1.31, 1.80, 0.03, 8, { mat: 'metal', col: '#2b2b2b', ext: 1 });
    B.cylZ(-11.30, 18.02, 1.67, 1.80, 0.11, 12, { mat: 'metal', col: '#1f1f1f', ext: 1 });
    B.cylZ(-11.30, 18.02, 1.645, 1.67, 0.095, 12, { mat: 'emissive', col: '#fff3dc', ext: 1 });
    // slatted fence panels on blue plinth with pale coping, between brick posts
    const panels = [[18.89, 21.60], [22.10, 23.85]];
    for (const [a, b] of panels) {
      B.box(-11.42, -11.17, a, b, -0.70, -0.10, { mat: 'blueConcrete', ext: 1, collide: true });
      B.box(-11.47, -11.12, a, b, -0.10, -0.04, { mat: 'stoneCap', ext: 1 });
      slatPanel(B, -11.295, a, b, -0.04, 1.10);
      B.addCollider(-11.35, -11.24, a, b, -0.04, 1.10);
    }
    brickPier(B, -11.52, -11.07, 21.60, 22.10, 1.25);
    brickPier(B, -11.52, -11.07, 23.85, 24.35, 1.25);
    if (nb) {
      // neighbour's gates shown closed
      slatPanel(B, -11.05, 13.44, 17.04, -0.62, 1.30, { mid: [15.24], t: 0.05 });
      B.addCollider(-11.09, -11.01, 13.44, 17.04, -0.62, 1.30);
      slatPanel(B, -11.30, 17.37, 18.32, -0.60, 1.20);
      B.addCollider(-11.34, -11.26, 17.37, 18.32, -0.60, 1.20);
    }
  }
  B.mirror = false;
  // our gates are interactive: sliding car gate and hinged entrance gate
  const G = new Builder(); G.group = 'site'; G.collide = false; G.extF = 1;
  slatPanel(G, -11.05, 13.44, 17.04, -0.62, 1.30, { mid: [15.24], t: 0.05 });
  for (const y of [13.9, 16.6]) G.cylP([-11.05, y - 0.06, -0.655], [-11.05, y + 0.06, -0.655], 0.05, 10, { mat: 'metal', col: '#3a3a3a', ext: 1, caps: true });
  B.doorDefs.push({ id: 'cargate', label: 'Car gate', group: 'site', builder: G, slide: [0, -2.85], startOpen: false, openAngle: 0,
    hinge: [-11.05, 13.44], closed: [0, 1], w: 3.60, z0: -0.62, box: { x0: -11.10, x1: -11.00, y0: 13.44, y1: 17.04, z0: -0.62, z1: 1.30 } });
  const P = new Builder(); P.group = 'site'; P.collide = false; P.extF = 1;
  slatPanel(P, -11.30, 17.37, 18.32, -0.60, 1.20);
  P.box(-11.36, -11.24, 18.20, 18.27, 0.30, 0.52, { mat: 'metal', col: '#2a2a2a', ext: 1 });
  P.box(-11.40, -11.20, 18.235, 18.25, 0.44, 0.46, { mat: 'metal', col: '#b9bcbe', ext: 1 });
  B.doorDefs.push({ id: 'gate', label: 'Entrance gate', group: 'site', builder: P, startOpen: true, openAngle: Math.PI / 2,
    hinge: [-11.30, 17.37], closed: [0, 1], w: 0.95, z0: -0.60, box: { x0: -11.34, x1: -11.26, y0: 17.37, y1: 18.32, z0: -0.60, z1: 1.20 } });
}
