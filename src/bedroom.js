// ---------- Rear bedroom (upstairs, facing the back garden), built from three photos ----------
// Wooden double bed against the party wall with a large canvas above it, a PAX-style wardrobe with
// three framed doors (white / frosted blue glass / white) in its niche, a narrow bookcase in the recess,
// dark green curtains, a panel radiator under the window and a perforated pendant shade.

// folded curtain: zig-zag vertical strip in front of a wall at x = xw (facing -x), from y0 to y1
function drapeX(B, xw, y0, y1, z0, z1, folds, depth, col, o) {
  const n = folds * 2, pts = [];
  for (let i = 0; i <= n; i++) pts.push([xw - depth * (i % 2 ? 1 : 0.15), y0 + (y1 - y0) * i / n]);
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[i + 1];
    facet(B, 'drape', [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]], [-1, 0, 0], Object.assign({ col }, o));
  }
}

function buildRearBedroom(B) {
  const U = LV.U, UC = LV.UC;
  const g0 = B.group; B.group = 'upper'; B.mirror = false; B.extF = 0;
  const IN = { ext: 0, fz: U, cz: UC };
  const O = (o) => Object.assign({}, o, IN);
  const R = rng(401);

  // ---- the wall beside the wardrobe niche (the wardrobe fills the niche, its doors flush with this wall) ----
  B.box(6.74, 8.07, 15.34, 15.94, U, UC, O({ mat: 'plaster', collide: true, f: { zp: null, xn: null, yp: null } }));

  // ---- wardrobe: dark brown carcass, three framed doors, brown top board, rolled topper on top ----
  {
    const X0 = 8.07, X1 = 9.86, YF = 15.34, Y1 = 15.94, H = 2.30, brown = '#3a2820';
    B.box(X0, X1, YF + 0.02, Y1, U, U + H, O({ mat: 'paint', col: brown, collide: true, f: { yn: null } }));
    const doors = [[9.265, 9.855, 'paper', 'r'], [8.67, 9.26, 'glass', 'r'], [8.075, 8.665, 'paper', 'l']];
    const zb = U + 0.02, zt = U + 2.28, fr = 0.022, bar = 0.012;
    B.poly('paint', [[X0, YF + 0.02, U], [X1, YF + 0.02, U], [X1, YF + 0.02, U + H], [X0, YF + 0.02, U + H]], [0, -1, 0], O({ col: '#1c130e' }));
    for (const [a, b, kind, hs] of doors) {
      // each framed door swings open into the room, hinged on the side away from its handle
      const hEdge = hs === 'r' ? b : a;
      B.mover({ hinge: [hEdge, YF + 0.01], openAngle: hingeAng([hs === 'r' ? -1 : 1, 0], [0, -1], 1.05), w: b - a, label: 'wardrobe door', center: [(a + b) / 2, YF - 0.02, U + 1.1] }, (D) => {
        if (kind === 'glass') D.box(a, b, YF + 0.008, YF + 0.02, zb, zt, O({ mat: 'gloss', col: '#8eaaa6' }));
        else D.box(a, b, YF + 0.008, YF + 0.02, zb, zt, O({ mat: 'fabric', col: '#f6f3ec' }));
        const FO = O({ mat: 'paint', col: brown });
        D.box(a, a + fr, YF, YF + 0.008, zb, zt, FO); D.box(b - fr, b, YF, YF + 0.008, zb, zt, FO);
        D.box(a + fr, b - fr, YF, YF + 0.008, zb, zb + fr, FO); D.box(a + fr, b - fr, YF, YF + 0.008, zt - fr, zt, FO);
        for (let k = 1; k < 4; k++) { const z = zb + (zt - zb) * k / 4; D.box(a + fr, b - fr, YF + 0.002, YF + 0.008, z - bar / 2, z + bar / 2, FO); }
        const hx = hs === 'r' ? a + 0.035 : b - 0.035;
        D.box(hx - 0.008, hx + 0.008, YF - 0.018, YF, U + 1.03, U + 1.13, O({ mat: 'gloss', col: '#f1f1ef' }));
      });
    }
    B.box(X0, X1, 15.22, Y1, U + H, U + H + 0.035, O({ mat: 'woodDark', col: '#c9a898' }));
    B.cylP([X0 + 0.06, 15.58, U + H + 0.11], [X1 - 0.06, 15.58, U + H + 0.11], 0.075, 12, O({ mat: 'fabric', col: '#ece7db', caps: true }));
  }

  // ---- bed: warm wood frame with a framed headboard against the party wall ----
  {
    const X0 = 7.25, X1 = 9.05, Y0 = 12.19, Y1 = 14.28;
    const WO = O({ mat: 'oak', col: '#d8b8a8' });
    // headboard: back panel, frame, rounded top rail
    B.box(X0, X1, Y0, Y0 + 0.035, U + 0.16, U + 0.95, WO);
    B.box(X0, X0 + 0.07, Y0 + 0.035, Y0 + 0.065, U + 0.16, U + 0.95, WO); B.box(X1 - 0.07, X1, Y0 + 0.035, Y0 + 0.065, U + 0.16, U + 0.95, WO);
    B.box(X0 + 0.07, X1 - 0.07, Y0 + 0.035, Y0 + 0.065, U + 0.87, U + 0.95, WO);
    B.box(X0 + 0.07, X1 - 0.07, Y0 + 0.035, Y0 + 0.055, U + 0.46, U + 0.52, WO);
    B.cylP([X0, Y0 + 0.04, U + 0.955], [X1, Y0 + 0.04, U + 0.955], 0.035, 10, Object.assign({ caps: true }, WO));
    // side and foot rails with rounded foot corners, short legs
    B.box(X0, X0 + 0.04, Y0 + 0.065, Y1 - 0.04, U + 0.20, U + 0.42, WO);
    B.box(X1 - 0.04, X1, Y0 + 0.065, Y1 - 0.04, U + 0.20, U + 0.42, WO);
    B.box(X0 + 0.04, X1 - 0.04, Y1 - 0.04, Y1, U + 0.20, U + 0.42, WO);
    for (const x of [X0 + 0.04, X1 - 0.04]) B.cylZ(x, Y1 - 0.04, U + 0.20, U + 0.42, 0.04, 10, WO);
    for (const [x, y] of [[X0 + 0.01, Y0 + 0.07], [X1 - 0.07, Y0 + 0.07], [X0 + 0.01, Y1 - 0.08], [X1 - 0.07, Y1 - 0.08]]) B.box(x, x + 0.06, y, y + 0.06, U, U + 0.20, WO);
    // mattress in a cream fitted sheet
    B.box(X0 + 0.045, X1 - 0.045, Y0 + 0.07, Y1 - 0.045, U + 0.25, U + 0.48, O({ mat: 'sheet', col: '#ffffff' }));
    // two crumpled pillows
    for (const [px, py, s] of [[7.72, 12.52, 1], [8.52, 12.50, -1]]) {
      B.sph(px, py, U + 0.54, 0.31, 0.22, 0.09, 14, O({ mat: 'paint', col: '#fafaf8' }));
      B.sph(px + s * 0.10, py + 0.05, U + 0.575, 0.17, 0.13, 0.05, 10, O({ mat: 'paint', col: '#ffffff' }));
      B.sph(px - s * 0.12, py - 0.04, U + 0.56, 0.12, 0.10, 0.045, 8, O({ mat: 'paint', col: '#f4f4f2' }));
    }
    B.addCollider(X0 - 0.01, X1 + 0.01, Y0 - 0.02, Y1 + 0.02, U, U + 0.55);
    for (const px of [7.72, 8.52]) B.seats.push({ kind: 'lie', x: px, y: 12.50, seatZ: U + 0.48, face: [0, 1], label: 'bed' });
    // canvas print above the bed, wrapped edges
    B.box(7.35, 8.75, 12.17, 12.21, U + 1.42, U + 2.22, O({ mat: 'paint', col: '#6a5e52', f: { yp: null } }));
    B.poly('pierArt', [[7.35, 12.21, U + 1.42], [8.75, 12.21, U + 1.42], [8.75, 12.21, U + 2.22], [7.35, 12.21, U + 2.22]], [0, 1, 0], Object.assign({ uvs: [[0, 1], [1, 1], [1, 0], [0, 0]], col: '#ffffff' }, IN));
  }

  // ---- narrow bookcase in the recess by the door: glass door above, solid door below ----
  {
    const X0 = 6.08, X1 = 6.36, Y0 = 12.17, Y1 = 12.57, H = 2.02, t = 0.018;
    const WO = O({ mat: 'oak', col: '#c4a292' });
    B.box(X0, X1, Y0, Y0 + t, U, U + H, WO); B.box(X0, X1, Y1 - t, Y1, U, U + H, WO);
    B.box(X0, X1, Y0 + t, Y1 - t, U + H - t, U + H, WO); B.box(X0, X1, Y0 + t, Y1 - t, U, U + 0.06, WO);
    B.box(X0, X0 + 0.01, Y0 + t, Y1 - t, U + 0.06, U + H - t, WO);
    for (const z of [0.95, 1.30, 1.64]) B.box(X0 + 0.01, X1 - 0.02, Y0 + t, Y1 - t, U + z, U + z + t, WO);
    // lower solid door and upper glazed door (frame + faint glass)
    B.box(X1 - 0.02, X1, Y0 + 0.004, Y1 - 0.004, U + 0.065, U + 0.94, WO);
    const gz0 = U + 0.955, gz1 = U + H - 0.02, gf = 0.045;
    B.box(X1 - 0.02, X1, Y0 + 0.004, Y0 + 0.004 + gf, gz0, gz1, WO); B.box(X1 - 0.02, X1, Y1 - 0.004 - gf, Y1 - 0.004, gz0, gz1, WO);
    B.box(X1 - 0.02, X1, Y0 + 0.004 + gf, Y1 - 0.004 - gf, gz0, gz0 + gf, WO); B.box(X1 - 0.02, X1, Y0 + 0.004 + gf, Y1 - 0.004 - gf, gz1 - gf, gz1, WO);
    B.poly('poly', [[X1 - 0.012, Y0 + 0.05, gz0 + gf], [X1 - 0.012, Y1 - 0.05, gz0 + gf], [X1 - 0.012, Y1 - 0.05, gz1 - gf], [X1 - 0.012, Y0 + 0.05, gz1 - gf]], [1, 0, 0], IN);
    B.box(X1, X1 + 0.012, Y1 - 0.07, Y1 - 0.055, U + 0.86, U + 0.90, O({ mat: 'metal', col: '#9a9a96' }));
    // contents: a small box on the top shelf, a row of binders, a pile of papers
    B.box(6.16, 6.28, 12.25, 12.36, U + 1.658, U + 1.74, O({ mat: 'paint', col: '#c9b48c' }));
    B.box(6.10, 6.30, 12.20, 12.54, U + 1.318, U + 1.56, O({ mat: 'paint', col: '#f2f2ef', f: { xp: 'books' }, uvf: { xp: [[1, 1], [0, 1], [0, 0], [1, 0]] } }));
    for (let k = 0; k < 6; k++) B.box(6.11 + R() * 0.02, 6.31 + R() * 0.02, 12.21 + R() * 0.02, 12.50 + R() * 0.02, U + 0.968 + k * 0.012, U + 0.978 + k * 0.012, O({ mat: 'paint', col: ['#f4f4f1', '#6d8fc4', '#eeeeea', '#9fb7d8', '#fafafa', '#e5e0d6'][k] }));
    B.addCollider(X0, X1 + 0.02, Y0, Y1, U, U + H);
  }

  // ---- window wall: panel radiator, dark green curtains on a rod, socket ----
  radiator(B, 'x', 9.86, -1, 14.02, 15.20, U + 0.12, U + 0.64);
  for (let k = 0; k < 22; k++) B.box(9.736, 9.74, 14.05 + k * 0.052, 14.056 + k * 0.052, U + 0.15, U + 0.61, O({ mat: 'paint', col: '#dededa' }));
  for (const y of [14.06, 15.16]) B.cylP([9.78, y, U + 0.12], [9.78, y, U + 0.08], 0.012, 8, O({ mat: 'metal', col: '#c4c4c0', caps: true }));
  B.cylP([9.775, 12.42, U + 2.385], [9.775, 15.33, U + 2.385], 0.011, 8, O({ mat: 'metal', col: '#8c9093', caps: true }));
  for (const y of [12.46, 15.29]) B.box(9.775, 9.86, y - 0.01, y + 0.01, U + 2.37, U + 2.40, O({ mat: 'metal', col: '#8c9093' }));
  const green = '#415047';
  const cc = { link: 'rbCurt', label: 'curtains', verbs: ['Close', 'Open'], center: [9.80, 14.32, U + 1.5], reach: 1.9, cone: 0.6 };
  B.mover(Object.assign({ scaleY: { pivot: 12.97, k: (14.32 - 12.97) / (13.45 - 12.97) } }, cc), (D) => drapeX(D, 9.815, 12.97, 13.45, U + 0.01, U + 2.37, 5, 0.06, green, IN));
  B.mover(Object.assign({ scaleY: { pivot: 15.33, k: (15.33 - 14.32) / (15.33 - 15.10) } }, cc), (D) => {
    drapeX(D, 9.815, 15.10, 15.33, U + 0.0, U + 2.37, 3, 0.05, green, IN);
    D.box(9.70, 9.83, 15.03, 15.33, U, U + 0.02, O({ mat: 'drape', col: green }));
  });
  B.box(9.855, 9.86, 12.50, 12.64, U + 0.28, U + 0.35, O({ mat: 'paint', col: '#f3f3f0' }));
  // light switch beside the door
  B.box(6.74, 6.748, 14.20, 14.28, U + 1.03, U + 1.11, O({ mat: 'paint', col: '#f3f3f0' }));

  // ---- pendant: perforated dark shade with a copper lining ----
  {
    const cx = 8.15, cy = 14.15, r = 0.22, z0 = U + 1.92, z1 = U + 2.25, n = 24;
    B.cone(cx, cy, UC - 0.05, UC, 0.045, 0.065, 12, O({ mat: 'paint', col: '#1b1a19' }));
    B.cylZ(cx, cy, z1, UC - 0.05, 0.004, 5, O({ mat: 'paint', col: '#111' }));
    B.cylZ(cx, cy, z0, z1, r, n, O({ mat: 'shade', caps: false }));
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, am = (a0 + a1) / 2, ri = r - 0.004;
      B.poly('metal', [[cx + Math.cos(a0) * ri, cy + Math.sin(a0) * ri, z0], [cx + Math.cos(a1) * ri, cy + Math.sin(a1) * ri, z0], [cx + Math.cos(a1) * ri, cy + Math.sin(a1) * ri, z1], [cx + Math.cos(a0) * ri, cy + Math.sin(a0) * ri, z1]],
        [-Math.cos(am), -Math.sin(am), 0], O({ col: '#b8703f' }));
    }
    // top ring and bulb holder
    B.cylZ(cx, cy, z1 - 0.006, z1, r - 0.004, n, O({ mat: 'metal', col: '#b8703f' }));
    B.cylZ(cx, cy, z1 - 0.07, z1 - 0.004, 0.025, 10, O({ mat: 'paint', col: '#1b1a19' }));
    B.sph(cx, cy, z1 - 0.12, 0.04, 0.04, 0.055, 10, O({ mat: 'gloss', col: '#f4efe4' }));
  }
  B.group = g0;
}
