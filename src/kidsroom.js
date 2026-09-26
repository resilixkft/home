// ---------- Front bedroom (street side, last room on the left of the upstairs corridor), from six photos ----------
// L-shaped built-in wardrobe in honey-oak laminate in the corner by the door, an IKEA KURA bed turned upside down
// (sleeping level on top) with a sea-animal bed tent whose side panel hangs to the floor, a 4x2 KALLAX with fabric
// boxes, a white MICKE desk under the window with an ÖRFJÄLL chair, lime green curtains and a bare pendant bulb.

// gathered curtain in front of a wall at x = xw facing +x, from y0 to y1
function drapeXp(B, xw, y0, y1, z0, z1, folds, depth, col) {
  const n = folds * 6, pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([xw + 0.01 + depth * (0.5 + 0.5 * Math.sin(t * folds * 2 * Math.PI)) * (0.8 + 0.2 * Math.sin(t * 7.3)), y0 + (y1 - y0) * t]); }
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[i + 1];
    facet(B, 'drape', [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]], [1, 0, 0], { col, ext: 0, fz: LV.U, cz: LV.UC });
  }
}

// bow handle standing off a door face: centre c on the face, outward normal n, vertical, 13 cm long
function bowHandle(B, c, n, o) {
  const P = (t, out) => [c[0] + n[0] * out, c[1] + n[1] * out, c[2] + t * 0.065];
  const pts = [];
  for (let i = 0; i <= 6; i++) { const t = -1 + i / 3; pts.push(P(t, 0.014 + 0.016 * (1 - t * t))); }
  B.cylP(P(-1, 0), pts[0], 0.0055, 6, o); B.cylP(P(1, 0), pts[6], 0.0055, 6, o);
  for (let i = 0; i < 6; i++) B.cylP(pts[i], pts[i + 1], 0.006, 6, o);
}

function buildFrontBedroom(B) {
  const U = LV.U, UC = LV.UC;
  const g0 = B.group; B.group = 'upper'; B.mirror = false; B.extF = 0;
  const IN = { ext: 0, fz: U, cz: UC };
  const O = (o) => Object.assign({}, IN, o);
  const R = rng(503);
  const white = '#f2f1ec';

  // =============== built-in wardrobe, L-shaped, in the corner by the door ===============
  // left wing along the party wall (front y = 12.77, facing +y), right wing in the recess (front x = 5.38, facing -x)
  {
    const YF = 12.77, XF = 5.38, XE = 4.48, g = 0.002, dark = '#3b2a1a', side = '#9a7446', hc = { mat: 'metal', col: '#a7a7a3', ext: 0 };
    const ZP = U + 0.07, ZM = U + 2.082, ZT = UC - 0.012;
    // end panel (visible from the window side)
    B.box(XE, XE + 0.02, 12.17, YF, U, UC, O({ mat: 'cabWood', f: { zp: null, zn: null, yn: null } }));
    // inside (seen when a door is open): divider, bottom, shelves, a top shelf across both wings and a hanging rail
    const IO = O({ mat: 'paint', col: '#e3d8c6' });
    B.box(4.955, 4.975, 12.17, YF - 0.02, U, UC, IO);
    B.box(4.975, 5.98, 12.17, YF - 0.02, U + 0.05, U + 0.07, IO); B.box(XF + 0.02, 5.98, YF - 0.02, 13.92, U + 0.05, U + 0.07, IO);
    B.box(4.975, 5.98, 12.17, YF - 0.02, ZM - 0.02, ZM, IO); B.box(XF + 0.02, 5.98, YF - 0.02, 13.92, ZM - 0.02, ZM, IO);
    for (const z of [U + 0.48, U + 0.90, U + 1.32, U + 1.74]) B.box(4.975, 5.37, 12.17, YF - 0.02, z, z + 0.018, IO);
    B.cylP([5.70, YF + 0.02, U + 1.86], [5.70, 13.90, U + 1.86], 0.012, 8, O({ mat: 'metal', col: '#b9bbbd' }));
    // one slab: a box with darker edges and a separate wood-grain front face
    const slabY = (B, a, b, z0, z1) => {        // left wing, face at y = YF
      B.box(a + g, b - g, YF - 0.02, YF, z0 + g, z1 - g, O({ mat: 'cabWood', col: side, f: { yp: null } }));
      B.poly('cabWood', [[a + g, YF, z0 + g], [b - g, YF, z0 + g], [b - g, YF, z1 - g], [a + g, YF, z1 - g]], [0, 1, 0], O({ uo: R() * 0.5 }));
    };
    const slabX = (B, a, b, z0, z1) => {        // right wing, face at x = XF
      B.box(XF, XF + 0.02, a + g, b - g, z0 + g, z1 - g, O({ mat: 'cabWood', col: side, f: { xn: null } }));
      B.poly('cabWood', [[XF, a + g, z0 + g], [XF, b - g, z0 + g], [XF, b - g, z1 - g], [XF, a + g, z1 - g]], [-1, 0, 0], O({ uo: R() * 0.5 }));
    };
    // plinths
    B.box(XE + 0.02, XF, YF - 0.035, YF - 0.015, U, ZP, O({ mat: 'cabWood', col: '#b89a78', f: { yn: null, zn: null } }));
    B.box(XF + 0.015, XF + 0.035, YF - 0.015, 13.92, U, ZP, O({ mat: 'cabWood', col: '#b89a78', f: { xp: null, zn: null } }));
    // left wing: blank panel over the chimney, then a narrow door with its top door; handles on the west edge
    slabY(B, XE + 0.02, 4.957, ZP, ZT);
    // narrow door (and its top door) hinged at the inner corner; it can only swing about 80 degrees before it meets the other wing
    for (const [z0, z1, hz] of [[ZP, ZM, 1.02], [ZM, ZT, 2.24]]) {
      B.mover({ hinge: [XF - g, YF - 0.01], openAngle: hingeAng([-1, 0], [0, 1], 0.89), w: XF - 4.957, label: 'wardrobe door', center: [(4.957 + XF) / 2, YF + 0.02, (z0 + z1) / 2] }, (D) => {
        slabY(D, 4.957, XF, z0, z1); bowHandle(D, [4.957 + 0.045, YF, U + hz], [0, 1, 0], hc);
      });
    }
    // right wing: A (single, handle towards B), B + C (pair, handles at the split); hinged on the side away from the handle
    const cols = [[YF, 13.104, 'p', 0.89], [13.104, 13.512, 'p', 1.0], [13.512, 13.92, 'n', 1.0]];
    for (const [a, b, hs, k] of cols) {
      const hy = hs === 'p' ? b - 0.045 : a + 0.045;
      for (const [z0, z1, hz] of [[ZP, ZM, 1.02], [ZM, ZT, 2.24]]) {
        B.mover({ hinge: [XF + 0.01, hs === 'p' ? a + g : b - g], openAngle: hingeAng([0, hs === 'p' ? 1 : -1], [-1, 0], k), w: b - a, label: 'wardrobe door', center: [XF - 0.02, (a + b) / 2, (z0 + z1) / 2] }, (D) => {
          slabX(D, a, b, z0, z1); bowHandle(D, [XF, hy, U + hz], [-1, 0, 0], hc);
        });
      }
    }
    B.addCollider(XE, 5.98, 12.17, YF + 0.03, U, UC);
    B.addCollider(XF - 0.03, 5.98, YF, 13.92, U, UC);
  }
  // skirting (dark green-grey), light switch and round vent cover by the door
  {
    const sk = O({ mat: 'paint', col: '#3a403a' }), h = U + 0.06;
    B.box(1.98, 4.48, 12.17, 12.182, U, h, sk); B.box(1.98, 1.992, 12.17, 15.32, U, h, sk); B.box(1.98, 5.16, 15.308, 15.32, U, h, sk);
    B.box(5.148, 5.16, 13.92, 14.32, U, h, sk); B.box(5.16, 5.38, 13.908, 13.92, U, h, sk);
    B.box(5.148, 5.16, 14.08, 14.16, U + 1.11, U + 1.19, O({ mat: 'paint', col: '#eee8da' }));
    B.box(5.144, 5.148, 14.095, 14.145, U + 1.125, U + 1.175, O({ mat: 'paint', col: '#f5f1e6' }));
    B.cylP([5.16, 14.12, U + 2.30], [5.154, 14.12, U + 2.30], 0.07, 16, O({ mat: 'paint', col: '#dcd8cf', caps: true }));
  }

  // =============== KURA bed, turned so the sleeping level is on top, with the bed tent ===============
  {
    const X0 = 2.12, X1 = 4.21, Y0 = 12.18, Y1 = 13.17, pine = O({ mat: 'paint', col: '#dcbd8c' }), pw = 0.05;
    for (const [x, y] of [[X0, Y0], [X1 - pw, Y0], [X0, Y1 - pw], [X1 - pw, Y1 - pw]]) B.box(x, x + pw, y, y + pw, U, U + 1.16, pine);
    // floor frame, bed-base rails, top rails
    for (const [z0, z1] of [[U + 0.02, U + 0.09], [U + 0.79, U + 0.90], [U + 1.12, U + 1.16]]) {
      B.box(X0 + pw, X1 - pw, Y0, Y0 + 0.022, z0, z1, pine); B.box(X0 + pw, X1 - pw, Y1 - 0.022, Y1, z0, z1, pine);
      B.box(X0, X0 + 0.022, Y0 + pw, Y1 - pw, z0, z1, pine); B.box(X1 - 0.022, X1, Y0 + pw, Y1 - pw, z0, z1, pine);
    }
    // white guard boards on the top level (ladder end: only the wall-side part)
    const gb = O({ mat: 'paint', col: white });
    B.box(X0 + pw, X1 - pw, Y0 + 0.004, Y0 + 0.018, U + 0.90, U + 1.12, gb); B.box(X0 + pw, X1 - pw, Y1 - 0.018, Y1 - 0.004, U + 0.90, U + 1.12, gb);
    B.box(X0 + 0.004, X0 + 0.018, Y0 + pw, Y1 - pw, U + 0.90, U + 1.12, gb);
    B.box(X1 - 0.018, X1 - 0.004, Y0 + pw, Y1 - 0.42, U + 0.90, U + 1.12, gb);
    // ladder on the room side of the end frame
    const LY = Y1 - 0.40;
    B.box(X1 - 0.045, X1, LY - 0.022, LY + 0.022, U, U + 1.16, pine);
    for (const z of [U + 0.27, U + 0.54]) B.box(X1 - 0.04, X1 - 0.005, LY + 0.022, Y1 - pw, z, z + 0.05, pine);
    // slatted base + mattress + navy bedding
    B.box(X0 + 0.03, X1 - 0.03, Y0 + 0.03, Y1 - 0.03, U + 0.80, U + 0.82, O({ mat: 'paint', col: '#d6b684' }));
    B.box(X0 + 0.05, X1 - 0.05, Y0 + 0.05, Y1 - 0.05, U + 0.82, U + 0.95, O({ mat: 'fabric', col: '#3b4868' }));
    B.cylP([X1 - 0.24, Y0 + 0.25, U + 0.99], [X1 - 0.24, Y1 - 0.25, U + 0.99], 0.07, 10, O({ mat: 'fabric', col: '#4a5a7c', caps: true }));
    // the ladder can be climbed: E at the foot of it takes you up onto the top bunk, lying under the tent
    B.seats.push({ kind: 'bunk', x: X1 + 0.05, y: LY + 0.18, seatZ: U + 0.95, label: 'ladder', lie: [X1 - 0.30, (Y0 + Y1) / 2 + 0.05, U + 1.08] });
    // bed tent: arched canopy over the top level + side panel hanging to the floor on the room side
    const cy = (Y0 + Y1) / 2, rw = (Y1 - Y0) / 2 + 0.01, rh = 0.62, zc = U + 1.16, n = 10, TO = O({ });
    const ax0 = X0 + 0.03, ax1 = X1 - 0.03;
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n;
      const p0 = [cy - Math.cos(a0) * rw, zc + Math.sin(a0) * rh], p1 = [cy - Math.cos(a1) * rw, zc + Math.sin(a1) * rh];
      const u0 = 0.75 + 0.25 * i / n, u1 = 0.75 + 0.25 * (i + 1) / n;
      const nm = [0, -(Math.cos(a0) + Math.cos(a1)) / 2, (Math.sin(a0) + Math.sin(a1)) / 2];
      B.poly('tent', [[ax0, p0[0], p0[1]], [ax1, p0[0], p0[1]], [ax1, p1[0], p1[1]], [ax0, p1[0], p1[1]]], nm,
        Object.assign({ uvs: [[u0, 0], [u0, 1], [u1, 1], [u1, 0]] }, TO));
    }
    // hanging side panel with a few soft folds at the hem
    const segs = 7, top = Y1 + 0.012;
    for (let i = 0; i < segs; i++) {
      const xa = ax0 + (ax1 - 0.06 - ax0) * i / segs, xb = ax0 + (ax1 - 0.06 - ax0) * (i + 1) / segs;
      const ya = top + 0.07 + (i % 2 ? 0.035 : 0), yb = top + 0.07 + ((i + 1) % 2 ? 0.035 : 0);
      const ua = 0.75 * i / segs, ub = 0.75 * (i + 1) / segs;
      facet(B, 'tent', [[xa, ya, U + 0.01], [xb, yb, U + 0.01], [xb, top, zc], [xa, top, zc]], [0, 1, 0], Object.assign({ uvs: [[ua, 1], [ub, 1], [ub, 0.02], [ua, 0.02]] }, TO));
    }
    B.addCollider(X0, X1, Y0, Y1 + 0.12, U, U + 1.8);
  }

  // =============== KALLAX 4x2 on the wall next to the door, with fabric boxes (pink top-left, blue bottom row) ===============
  {
    const X0 = 2.16, X1 = 3.63, Y0 = 14.93, Y1 = 15.32, H = 0.77, t = 0.038, m = 0.016;
    const KO = O({ mat: 'paint', col: white });
    B.box(X0, X0 + t, Y0, Y1, U, U + H, KO); B.box(X1 - t, X1, Y0, Y1, U, U + H, KO);
    B.box(X0 + t, X1 - t, Y0, Y1, U + H - t, U + H, KO); B.box(X0 + t, X1 - t, Y0, Y1, U, U + t, KO);
    const zm = U + (H - m) / 2; B.box(X0 + t, X1 - t, Y0, Y1, zm, zm + m, KO);
    const cw = (X1 - X0 - 2 * t - 3 * m) / 4;
    for (let i = 1; i < 4; i++) { const x = X0 + t + i * cw + (i - 1) * m; B.box(x, x + m, Y0, Y1, U + t, U + H - t, KO); }
    const cell = (i, row) => { const x = X1 - t - (i + 1) * cw - i * m; return [x, x + cw, row ? zm + m : U + t, row ? U + H - t : zm]; };
    const drona = (i, row, col) => {
      const [a, b, z0, z1] = cell(i, row), cx = (a + b) / 2;
      B.mover({ slide: [0, -0.24], label: 'box', verbs: ['Pull out', 'Push in'], center: [cx, Y0, (z0 + z1) / 2], reach: 1.5, cone: 0.35 }, (D) => {
        D.box(a + 0.005, b - 0.005, Y0 + 0.012, Y1 - 0.01, z0 + 0.002, z1 - 0.012, O({ mat: 'fabric', col, f: { zp: null } }));
        D.box(a + 0.012, b - 0.012, Y0 + 0.02, Y1 - 0.018, z0 + 0.004, z1 - 0.02, O({ mat: 'fabric', col: '#2a2f36', f: { zn: null, xn: null, xp: null, yn: null, yp: null } }));
        D.poly('paint', [[cx - 0.055, Y0 + 0.0115, z1 - 0.075], [cx + 0.055, Y0 + 0.0115, z1 - 0.075], [cx + 0.055, Y0 + 0.0115, z1 - 0.045], [cx - 0.055, Y0 + 0.0115, z1 - 0.045]], [0, -1, 0], O({ col: '#1e242c' }));
      });
    };
    drona(0, 1, '#d98f8b');
    for (let i = 0; i < 4; i++) drona(i, 0, '#8ea3b8');
    B.addCollider(X0, X1, Y0, Y1, U, U + H);
    // framed crayon drawing above it
    const px0 = 2.88, px1 = 3.30, pz0 = U + 1.50, pz1 = U + 1.80;
    B.box(px0, px1, Y1 - 0.022, Y1, pz0, pz1, O({ mat: 'paint', col: '#f4f4f0' }));
    B.poly('paint', [[px1 - 0.02, Y1 - 0.0225, pz0 + 0.02], [px0 + 0.02, Y1 - 0.0225, pz0 + 0.02], [px0 + 0.02, Y1 - 0.0225, pz1 - 0.02], [px1 - 0.02, Y1 - 0.0225, pz1 - 0.02]], [0, -1, 0], O({ col: '#fbfbf8' }));
    B.poly('kidArt', [[px1 - 0.05, Y1 - 0.023, pz0 + 0.05], [px0 + 0.05, Y1 - 0.023, pz0 + 0.05], [px0 + 0.05, Y1 - 0.023, pz1 - 0.05], [px1 - 0.05, Y1 - 0.023, pz1 - 0.05]], [0, -1, 0],
      O({ uvs: [[0, 1], [1, 1], [1, 0], [0, 0]] }));
  }

  // =============== MICKE desk under the window (pedestal towards the bed) ===============
  {
    const X0 = 2.11, X1 = 2.61, Y0 = 13.28, Y1 = 14.33, W = O({ mat: 'paint', col: white });
    B.box(X0, X1, Y0, Y1, U + 0.72, U + 0.75, W);
    // pedestal: drawer with a yellow knob, door with a cable slot
    B.box(X0 + 0.02, X1 - 0.012, Y0 + 0.005, 13.68, U, U + 0.72, W);
    B.mover({ slide: [0.30, 0], label: 'drawer', center: [X1, (Y0 + 13.675) / 2, U + 0.63], reach: 1.5, cone: 0.4 }, (D) => {
      D.box(X1 - 0.012, X1 - 0.002, Y0 + 0.01, 13.675, U + 0.555, U + 0.705, W);
      D.box(X1 - 0.33, X1 - 0.012, Y0 + 0.03, Y0 + 0.042, U + 0.57, U + 0.68, W); D.box(X1 - 0.33, X1 - 0.012, 13.643, 13.655, U + 0.57, U + 0.68, W);
      D.box(X1 - 0.33, X1 - 0.012, Y0 + 0.03, 13.655, U + 0.565, U + 0.575, W);
      D.sph(X1 + 0.012, (Y0 + 13.675) / 2, U + 0.63, 0.016, 0.016, 0.016, 8, O({ mat: 'gloss', col: '#f2cf2a' }));
    });
    B.box(X1 - 0.012, X1 - 0.002, Y0 + 0.01, 13.675, U + 0.03, U + 0.548, W);
    B.poly('paint', [[X1 - 0.0015, Y0 + 0.05, U + 0.50], [X1 - 0.0015, 13.635, U + 0.50], [X1 - 0.0015, 13.635, U + 0.515], [X1 - 0.0015, Y0 + 0.05, U + 0.515]], [1, 0, 0], O({ col: '#8d8d88' }));
    // slim drawer under the top between leg and pedestal
    B.mover({ slide: [0.30, 0], label: 'drawer', center: [X1, (13.69 + Y1 - 0.04) / 2, U + 0.67], reach: 1.5, cone: 0.4 }, (D) => {
      D.box(X1 - 0.02, X1 - 0.003, 13.69, Y1 - 0.04, U + 0.625, U + 0.72, W);
      D.box(X1 - 0.34, X1 - 0.02, 13.70, 13.712, U + 0.635, U + 0.70, W); D.box(X1 - 0.34, X1 - 0.02, Y1 - 0.062, Y1 - 0.05, U + 0.635, U + 0.70, W);
      D.box(X1 - 0.34, X1 - 0.02, 13.70, Y1 - 0.05, U + 0.63, U + 0.638, W);
    });
    // white tubular U-leg at the other end
    const tb = O({ mat: 'paint', col: '#f5f5f2' }), ly = Y1 - 0.035;
    B.box(X1 - 0.07, X1 - 0.045, ly - 0.0125, ly + 0.0125, U + 0.01, U + 0.72, tb); B.box(X0 + 0.04, X0 + 0.065, ly - 0.0125, ly + 0.0125, U + 0.01, U + 0.72, tb);
    B.box(X0 + 0.04, X1 - 0.045, ly - 0.0125, ly + 0.0125, U + 0.005, U + 0.03, tb);
    B.addCollider(X0, X1, Y0, Y1, U, U + 0.75);
  }

  // =============== ÖRFJÄLL swivel chair: white base and frame, light blue seat and back ===============
  {
    const cx = 2.97, cy = 13.98, blue = '#96b9c8', wh = O({ mat: 'paint', col: '#f4f4f1' });
    for (let k = 0; k < 5; k++) {
      const a = k * 2 * Math.PI / 5 + 0.3, ex = cx + Math.cos(a) * 0.29, ey = cy + Math.sin(a) * 0.29;
      B.cylP([cx, cy, U + 0.10], [ex, ey, U + 0.075], 0.017, 6, wh);
      B.cylP([ex, ey - 0.012, U + 0.03], [ex, ey + 0.012, U + 0.03], 0.026, 8, O({ mat: 'paint', col: '#e9e9e6', caps: true }));
    }
    B.cylZ(cx, cy, U + 0.08, U + 0.42, 0.026, 10, O({ mat: 'metal', col: '#dcdcd8' }));
    B.cylZ(cx, cy, U + 0.40, U + 0.425, 0.12, 10, wh);
    { const r = 0.2, c = 0.07, sq = [[-r + c, -r], [r - c, -r], [r, -r + c], [r, r - c], [r - c, r], [-r + c, r], [-r, r - c], [-r, -r + c]].map(([a, b]) => [cx + a, cy + b]);
      slabZ(B, sq, U + 0.425, U + 0.49, O({ mat: 'fabric', col: blue })); }
    // backrest on the side away from the desk, framed by a white tube loop
    const bx = cx + 0.215;
    B.box(bx - 0.02, bx + 0.025, cy - 0.175, cy + 0.175, U + 0.60, U + 0.86, O({ mat: 'fabric', col: blue }));
    const loop = [[bx - 0.05, cy - 0.205, U + 0.45], [bx + 0.005, cy - 0.205, U + 0.56], [bx + 0.012, cy - 0.205, U + 0.86], [bx + 0.012, cy - 0.17, U + 0.905],
      [bx + 0.012, cy + 0.17, U + 0.905], [bx + 0.012, cy + 0.205, U + 0.86], [bx + 0.005, cy + 0.205, U + 0.56], [bx - 0.05, cy + 0.205, U + 0.45]];
    for (let i = 0; i < loop.length - 1; i++) B.cylP(loop[i], loop[i + 1], 0.011, 6, wh);
    B.cylP([bx - 0.05, cy - 0.205, U + 0.45], [cx - 0.05, cy - 0.205, U + 0.45], 0.011, 6, wh);
    B.cylP([bx - 0.05, cy + 0.205, U + 0.45], [cx - 0.05, cy + 0.205, U + 0.45], 0.011, 6, wh);
    B.addCollider(cx - 0.24, cx + 0.26, cy - 0.24, cy + 0.24, U, U + 0.9);
    B.seats.push({ kind: 'sit', x: cx, y: cy, seatZ: U + 0.49, face: [-1, 0], label: 'chair' });
  }

  // =============== lime curtains on a white rod, window handle ===============
  B.cylP([2.075, 12.78, U + 2.42], [2.075, 14.96, U + 2.42], 0.011, 8, O({ mat: 'paint', col: '#ecebe7', caps: true }));
  const cc = { link: 'fbCurt', label: 'curtains', verbs: ['Close', 'Open'], center: [2.05, 13.87, U + 1.6], reach: 1.9, cone: 0.6 };
  B.mover(Object.assign({ scaleY: { pivot: 12.80, k: (13.87 - 12.80) / (13.27 - 12.80) } }, cc), (D) => drapeXp(D, 1.99, 12.80, 13.27, U + 0.88, U + 2.40, 5, 0.055, '#8fb236'));
  B.mover(Object.assign({ scaleY: { pivot: 14.94, k: (14.94 - 13.87) / (14.94 - 14.47) } }, cc), (D) => drapeXp(D, 1.99, 14.47, 14.94, U + 0.86, U + 2.40, 5, 0.055, '#8fb236'));

  // =============== bare bulb on a short white flex ===============
  {
    const x = 3.57, y = 13.75;
    B.cylZ(x, y, UC - 0.015, UC, 0.035, 10, O({ mat: 'paint', col: '#f3f3f0' }));
    B.cylZ(x, y, UC - 0.20, UC - 0.015, 0.004, 6, O({ mat: 'paint', col: '#f3f3f0' }));
    B.cylZ(x, y, UC - 0.265, UC - 0.20, 0.02, 10, O({ mat: 'paint', col: '#f4f4f1' }));
    B.sph(x, y, UC - 0.305, 0.045, 0.045, 0.05, 10, O({ mat: 'emissive', col: '#fff3d8' }));
  }

  B.group = g0;
}
