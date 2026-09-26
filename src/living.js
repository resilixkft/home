// ---------- Living room corner: fireplace and bookcases (built from three photos) ----------
// Against the party wall (y = 12.23), from the street-side corner: three IKEA BILLY bookcases side by side (empty),
// then the fireplace: a klinker brick column floor to ceiling with a soldier course over the insert and over the
// open log recess, and a warm-air grille high up. Right of the column a plastered flue block steps back.
// Left out on purpose: the small white vent on the left side of the brickwork, the soot door on the flue block
// and anything in the log recess.

function buildLivingCorner(B) {
  const G = LV.G, GC = LV.GC;
  const g0 = B.group; B.group = 'ground'; B.mirror = false; B.extF = 0;
  const IN = { ext: 0, fz: G, cz: GC };
  const O = (o) => Object.assign({}, IN, o);
  const WALL = 12.23;

  // ---- three BILLY bookcases, 40 x 28 x 202 cm, white, no books ----
  {
    const W = 0.40, D = 0.28, H = 2.02, t = 0.016, x00 = 1.99, yb = WALL + 0.005, yf = yb + D;
    const P = (o) => O(Object.assign({ mat: 'paint', col: '#f3f3f0' }, o));
    for (let i = 0; i < 3; i++) {
      const a = x00 + i * W, b = a + W;
      B.box(a, a + t, yb, yf, G, H, P({ f: { zn: null } }));                          // sides
      B.box(b - t, b, yb, yf, G, H, P({ f: { zn: null } }));
      B.box(a + t, b - t, yb, yf, H - t, H, P({ f: { xn: null, xp: null } }));          // top
      B.box(a + t, b - t, yf - 0.02, yf - 0.002, G, 0.075, P({ f: { xn: null, xp: null, zp: null } })); // plinth
      B.box(a + t, b - t, yb + 0.004, yf - 0.002, 0.075, 0.075 + t, P({ f: { xn: null, xp: null, zn: null } })); // bottom shelf
      B.poly('paint', [[a + t, yb + 0.004, 0.075], [b - t, yb + 0.004, 0.075], [b - t, yb + 0.004, H - t], [a + t, yb + 0.004, H - t]], [0, 1, 0], P({ col: '#e2e2de' })); // back panel
      // five shelves, evenly spaced (six compartments)
      const z0 = 0.075 + t, gap = (H - t - z0 - 5 * t) / 6;
      for (let k = 1; k <= 5; k++) { const z = z0 + k * gap + (k - 1) * t; B.box(a + t, b - t, yb + 0.006, yf - 0.004, z, z + t, P({ f: { xn: null, xp: null } })); }
    }
    B.addCollider(x00, x00 + 3 * W, WALL, yf, G, H);
  }

  // ---- fireplace ----
  const F = FIRE, X0 = 3.40, X1 = X0 + F.F, YF = 12.76, YB = 12.60, XB = 4.88;
  const U = (u) => X0 + u;
  const uv = (x, z) => [(x - X0) / F.F, (F.H - z) / F.H];
  const front = (u0, u1, z0, z1) => {
    const p = [[U(u0), YF, z0], [U(u1), YF, z0], [U(u1), YF, z1], [U(u0), YF, z1]];
    B.poly('fireFront', p, [0, 1, 0], O({ uvs: p.map(q => uv(q[0], q[2])) }));
  };
  // front face, cut around the log recess and the firebox opening behind the glass door
  const hole = [0.29, 0.81, 0.534, 0.851];
  front(0, F.open[0], 0, F.open[3]); front(F.open[1], F.F, 0, F.open[3]);
  front(0, F.F, F.open[3], hole[2]); front(0, F.F, hole[3], F.H);
  front(0, hole[0], hole[2], hole[3]); front(hole[1], F.F, hole[2], hole[3]);
  // sides of the column: brick all the way back on the left, a short brick return on the right
  B.poly('fireBrick', [[X0, WALL, 0], [X0, YF, 0], [X0, YF, GC], [X0, WALL, GC]], [-1, 0, 0], O({ uo: 0.07 }));
  B.poly('fireBrick', [[X1, YB, 0], [X1, YF, 0], [X1, YF, GC], [X1, YB, GC]], [1, 0, 0], O({ uo: 0.11 }));
  B.addCollider(X0, X1, WALL, YF + 0.03, G, GC);
  // plastered flue block to the right, set back from the brick face
  B.box(X1, XB, WALL, YB, G, GC, O({ mat: 'plaster', f: { xn: null, yn: null, zn: null, zp: null } }));
  B.addCollider(X1, XB, WALL, YB, G, GC);

  // log recess under the insert: brick lined, left empty
  {
    const a = U(F.open[0]), b = U(F.open[1]), zt = F.open[3], yk = YF - 0.40;
    const dim = (c) => O({ col: c });
    B.poly('fireBrick', [[a, yk, 0], [a, YF, 0], [a, YF, zt], [a, yk, zt]], [1, 0, 0], dim('#a09a96'));
    B.poly('fireBrick', [[b, yk, 0], [b, YF, 0], [b, YF, zt], [b, yk, zt]], [-1, 0, 0], dim('#8c8784'));
    B.poly('fireBrick', [[a, yk, 0], [b, yk, 0], [b, yk, zt], [a, yk, zt]], [0, 1, 0], dim('#6e6a67'));
    B.poly('fireBrick', [[a, yk, zt], [b, yk, zt], [b, YF, zt], [a, YF, zt]], [0, 0, -1], dim('#5a5654'));
  }

  // ---- insert: cast-iron front, slotted top, glass door with a coil-spring handle ----
  const iron = (o) => O(Object.assign({ mat: 'paint', col: '#1e1e1f' }, o));
  const iX0 = U(F.ins[0]), iX1 = U(F.ins[1]), iZ0 = F.ins[2], iZ1 = F.ins[3], hX0 = U(hole[0]), hX1 = U(hole[1]);
  const fy = YF + 0.012;
  B.box(iX0, hX0, YF, fy, iZ0, iZ1, iron({ f: { yn: null } }));
  B.box(hX1, iX1, YF, fy, iZ0, iZ1, iron({ f: { yn: null } }));
  B.box(hX0, hX1, YF, fy, iZ0, hole[2], iron({ f: { yn: null, xn: null, xp: null } }));
  B.box(hX0, hX1, YF, fy, hole[3], iZ1, iron({ f: { yn: null, xn: null, xp: null } }));
  // air slots across the top
  for (let k = 0; k < 7; k++) { const sx = hX0 + 0.03 + k * (hX1 - hX0 - 0.06) / 7, w = (hX1 - hX0 - 0.06) / 7 - 0.012;
    B.poly('paint', [[sx, fy + 0.001, iZ1 - 0.055], [sx + w, fy + 0.001, iZ1 - 0.055], [sx + w, fy + 0.001, iZ1 - 0.035], [sx, fy + 0.001, iZ1 - 0.035]], [0, 1, 0], O({ col: '#070707' })); }
  // firebox behind the glass: dark cast-iron back with ribs, ash on the floor
  {
    const a = hX0, b = hX1, z0 = hole[2], z1 = hole[3], yk = YF - 0.34, dk = (c) => O({ mat: 'paint', col: c });
    B.poly('paint', [[a, yk, z0], [b, yk, z0], [b, yk, z1], [a, yk, z1]], [0, 1, 0], dk('#262422'));
    B.poly('paint', [[a, yk, z0], [a, YF, z0], [a, YF, z1], [a, yk, z1]], [1, 0, 0], dk('#2b2826'));
    B.poly('paint', [[b, yk, z0], [b, YF, z0], [b, YF, z1], [b, yk, z1]], [-1, 0, 0], dk('#2b2826'));
    B.poly('paint', [[a, yk, z1], [b, yk, z1], [b, YF, z1], [a, YF, z1]], [0, 0, -1], dk('#141312'));
    B.poly('paint', [[a, yk, z0], [b, yk, z0], [b, YF, z0], [a, YF, z0]], [0, 0, 1], dk('#3b3835'));
    for (let k = 0; k < 6; k++) { const rx = a + 0.05 + k * (b - a - 0.1) / 5; B.box(rx - 0.008, rx + 0.008, yk, yk + 0.012, z0, z1, dk('#1c1b1a')); }
    B.sph((a + b) / 2 + 0.08, yk + 0.15, z0 + 0.008, 0.10, 0.07, 0.022, 10, dk('#6f6a64'));
  }
  // door: hinged on the left, handle and spring on the right; opens outwards with E
  {
    const dX0 = hX0 - 0.012, dX1 = hX1 + 0.012, dZ0 = hole[2] - 0.012, dZ1 = hole[3] + 0.006, fw = 0.042, y0 = fy, y1 = fy + 0.02;
    B.mover({ hinge: [dX0, (y0 + y1) / 2], openAngle: hingeAng([1, 0], [0, 1], 1.0), w: dX1 - dX0, label: 'fireplace door',
      center: [(dX0 + dX1) / 2, YF + 0.05, (dZ0 + dZ1) / 2], reach: 1.7 }, (D) => {
      D.box(dX0, dX1, y0, y1, dZ0, dZ0 + fw, iron({ f: { yn: null } }));
      D.box(dX0, dX1, y0, y1, dZ1 - fw, dZ1, iron({ f: { yn: null } }));
      D.box(dX0, dX0 + fw, y0, y1, dZ0 + fw, dZ1 - fw, iron({ f: { yn: null } }));
      D.box(dX1 - fw, dX1, y0, y1, dZ0 + fw, dZ1 - fw, iron({ f: { yn: null } }));
      D.box(dX0 + fw, dX1 - fw, y0, y0 + 0.006, dZ0 + fw - 0.004, dZ0 + fw, iron({}));
      // normal into the firebox: seen from the room it reads as clear glass over a dark firebox, not as a window from outside
      D.poly('glass', [[dX0 + fw, y0 + 0.008, dZ0 + fw], [dX1 - fw, y0 + 0.008, dZ0 + fw], [dX1 - fw, y0 + 0.008, dZ1 - fw], [dX0 + fw, y0 + 0.008, dZ1 - fw]], [0, -1, 0], O({}));
      // air slider knob at the bottom middle and the maker's plate at the lower left
      D.cylP([(dX0 + dX1) / 2, y1, dZ0 + 0.021], [(dX0 + dX1) / 2, y1 + 0.012, dZ0 + 0.021], 0.008, 10, O({ mat: 'metal', col: '#8d9093', caps: true }));
      D.box(dX0 + 0.05, dX0 + 0.11, y1, y1 + 0.001, dZ0 + 0.014, dZ0 + 0.026, O({ mat: 'metal', col: '#9ea1a4' }));
      // handle: black lever and a chrome coil spring hanging below the door
      const hx = dX1 - 0.022, hy = y1 + 0.016;
      D.box(hx - 0.007, hx + 0.007, y1, hy + 0.006, dZ0 + 0.10, dZ0 + 0.20, iron({}));
      const cz0 = dZ0 - 0.035, cz1 = dZ0 + 0.10, chrome = O({ mat: 'metal', col: '#d5d8db' });
      D.cylP([hx - 0.006, hy, cz0], [hx - 0.006, hy, cz1], 0.0028, 6, chrome);
      D.cylP([hx + 0.006, hy, cz0], [hx + 0.006, hy, cz1], 0.0028, 6, chrome);
      D.cylP([hx - 0.006, hy, cz0], [hx + 0.006, hy, cz0], 0.0028, 6, chrome);
      for (let k = 0; k < 9; k++) { const z = cz0 + 0.02 + k * 0.011; D.cylZ(hx, hy, z, z + 0.004, 0.0095, 10, Object.assign({ caps: false }, chrome)); }
    });
  }
  // warm-air grille high on the brickwork: thin dark bronze frame, black mesh
  {
    const a = U(F.grille[0]), b = U(F.grille[1]), z0 = F.grille[2], z1 = F.grille[3], fr = 0.016, y1 = YF + 0.008, fc = O({ mat: 'metal', col: '#4a4540' });
    B.box(a, b, YF, y1, z0, z0 + fr, fc); B.box(a, b, YF, y1, z1 - fr, z1, fc);
    B.box(a, a + fr, YF, y1, z0 + fr, z1 - fr, fc); B.box(b - fr, b, YF, y1, z0 + fr, z1 - fr, fc);
    B.poly('paint', [[a + fr, YF + 0.003, z0 + fr], [b - fr, YF + 0.003, z0 + fr], [b - fr, YF + 0.003, z1 - fr], [a + fr, YF + 0.003, z1 - fr]], [0, 1, 0], O({ col: '#151515' }));
  }

  B.group = g0;
}
