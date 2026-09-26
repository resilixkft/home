// ---------- Upstairs bathroom (next to the rear bedroom), door corner built from a photo ----------
// Cream 25 x 20 cm glazed wall tiles floor to ceiling on every wall, dark aubergine 20 x 20 cm floor tiles,
// and a floor-to-ceiling built-in cabinet in pale sage green on the wall shared with the rear bedroom,
// just to the right of the door (seen from inside): two tall lower doors, two middle doors, a recessed rail
// and two small top doors, all with short stainless knobs near the centre split.

function buildUpperBath(B) {
  const U = LV.U, UC = LV.UC;
  const g0 = B.group; B.group = 'upper'; B.mirror = false; B.extF = 0;
  const IN = { ext: 0, fz: U, cz: UC };
  const O = (o) => Object.assign({}, IN, o);
  const X0 = 6.74, X1 = 9.86, Y0 = 16.04, Y1 = 17.82, e = 0.003;

  // ---- floor (grout lines start at the door wall and at the cabinet wall) ----
  B.floor(X0, X1, Y0, Y1, U, 'ubFloor', O({ uo: -X0, vo: -Y0 }));
  B.floor(6.64, X0, 16.22, 16.97, U, 'ubFloor', O({ uo: -X0, vo: -Y0 }));

  // ---- wall tiles, full height, rows start at the floor ----
  const zT = UC - 0.002;
  // wall facing +y (shared with the rear bedroom): the built-in cabinet stands in front of it
  const tY = (y, n, a, b, z0, z1) => B.poly('ubTile', [[a, y, z0], [b, y, z0], [b, y, z1], [a, y, z1]], [0, n, 0], O({ uo: n > 0 ? -6.94 : X0, vo: U }));
  const tX = (x, n, a, b, z0, z1) => B.poly('ubTile', [[x, a, z0], [x, b, z0], [x, b, z1], [x, a, z1]], [n, 0, 0], O({ uo: n > 0 ? Y0 : -Y0, vo: U }));
  tY(Y0 + e, 1, X0, 6.97, U, zT); tY(Y0 + e, 1, 8.02, X1, U, zT);
  tY(Y1 - e, -1, X0, X1, U, zT);
  // door wall: opening 16.22..16.97 up to U + 2.05
  tX(X0 + e, 1, Y0, 16.22, U, zT); tX(X0 + e, 1, 16.97, Y1, U, zT); tX(X0 + e, 1, 16.22, 16.97, U + 2.05, zT);
  // window wall: opening 16.30..16.90, WIN_UP.zb..WIN_UP.zt
  tX(X1 - e, -1, Y0, 16.30, U, zT); tX(X1 - e, -1, 16.90, Y1, U, zT);
  tX(X1 - e, -1, 16.30, 16.90, U, WIN_UP.zb); tX(X1 - e, -1, 16.30, 16.90, WIN_UP.zt, zT);

  // ---- built-in cabinet, pale sage green, floor to ceiling ----
  {
    const sage = '#cfd5b6', CB = Y0 + 0.028, CF = Y0 + 0.045, a = 6.97, b = 8.02, s0 = 7.00, s1 = 7.96, mid = 7.48, g = 0.0032;
    const P = (o) => O(Object.assign({ mat: 'paint', col: sage }, o));
    B.box(a, s0, Y0 + e, CF, U, UC, P({ f: { yn: null, zn: null, zp: null } }));              // left stile
    B.box(s1, b, Y0 + e, CF, U, UC, P({ f: { yn: null, zn: null, zp: null } }));              // right stile (its side catches the window light)
    B.box(s0, s1, Y0 + e, CF, U + 2.42, UC, P({ f: { yn: null, zp: null, xn: null, xp: null } })); // top rail
    // the cabinet is recessed about 60 cm into the wall shared with the bedroom
    const RB = 15.40, IO = O({ mat: 'paint', col: '#e6e8df' }), ZI = U + 2.42;
    const q0 = s0 + 0.002, q1 = s1 - 0.002, qt = ZI - 0.002;
    B.poly('paint', [[q0, RB, U], [q1, RB, U], [q1, RB, qt], [q0, RB, qt]], [0, 1, 0], IO);
    B.poly('paint', [[q0, RB, U], [q0, CB, U], [q0, CB, qt], [q0, RB, qt]], [1, 0, 0], IO);
    B.poly('paint', [[q1, RB, U], [q1, CB, U], [q1, CB, qt], [q1, RB, qt]], [-1, 0, 0], IO);
    B.poly('paint', [[q0, RB, qt], [q1, RB, qt], [q1, CB, qt], [q0, CB, qt]], [0, 0, -1], IO);
    B.poly('paint', [[s0, RB, U + 0.004], [s1, RB, U + 0.004], [s1, CB, U + 0.004], [s0, CB, U + 0.004]], [0, 0, 1], IO);
    // recessed rail between the middle and the top doors
    B.box(s0, s1, CB, CF - 0.014, U + 2.085, U + 2.138, P({ col: '#adb591', f: { yn: null, xn: null, xp: null } }));
    const rows = [[U + 0.004, U + 1.380, 0.90], [U + 1.386, U + 2.083, 1.44], [U + 2.140, U + 2.418, 2.185]];
    rows.forEach(([z0, z1, hz], ri) => {
      [[s0 + g, mid - g, mid - 0.04, 1], [mid + g, s1 - g, mid + 0.04, -1]].forEach(([d0, d1, hx, sg], di) => {
        // each door hinges on its outer edge and swings out; edges a shade darker so the gaps read as lines
        B.mover({ hinge: [sg > 0 ? d0 : d1, (CB + CF) / 2], openAngle: hingeAng([sg, 0], [0, 1], 1.05), w: d1 - d0, label: 'cabinet door', center: [(d0 + d1) / 2, CF + 0.02, (z0 + z1) / 2] }, (D) => {
          D.box(d0, d1, CB, CF, z0 + g, z1 - g, P({ col: '#8d937c', f: { yn: null, yp: null } }));
          D.poly('paint', [[d0, CF, z0 + g], [d1, CF, z0 + g], [d1, CF, z1 - g], [d0, CF, z1 - g]], [0, 1, 0], P({}));
          D.cylP([hx, CF, U + hz], [hx, CF + 0.026, U + hz], 0.0055, 8, O({ mat: 'metal', col: '#c9ccce' }));
          D.cylP([hx, CF + 0.026, U + hz], [hx, CF + 0.034, U + hz], 0.009, 10, O({ mat: 'metal', col: '#d4d6d8', caps: true }));
          if (ri === 0 && di === 0) D.cylP([mid - 0.035, CF, U + 1.045], [mid - 0.035, CF + 0.004, U + 1.045], 0.007, 10, O({ mat: 'metal', col: '#c9ccce', caps: true }));
        });
      });
    });
    // shelves inside, a few folded towels and bottles
    for (const z of [U + 0.45, U + 0.92, U + 1.38, U + 2.08]) B.box(s0, s1, RB, CB - 0.004, z, z + 0.018, P({ col: '#eef0e8' }));
    for (const [x, z, c] of [[7.12, 0.938, '#f4f2ec'], [7.42, 0.938, '#c9d6de'], [7.70, 1.398, '#f4f2ec'], [7.20, 1.398, '#d9c9b4'], [7.55, 0.468, '#f4f2ec']])
      for (let k = 0; k < 3; k++) B.box(x - 0.13, x + 0.13, RB + 0.12, RB + 0.42, U + z + k * 0.055, U + z + k * 0.055 + 0.05, O({ mat: 'fabric', col: c }));
    for (const [x, c] of [[7.80, '#5b8fb8'], [7.87, '#f0f0ee'], [7.93, '#8fb85b']]) B.cylZ(x, RB + 0.25, U + 0.468, U + 0.468 + 0.2, 0.03, 10, O({ mat: 'gloss', col: c }));
    B.addCollider(a, b, Y0, CF + 0.04, U, UC);
  }

  // ---- socket low on the tiled wall beside the cabinet, towel hook further along ----
  B.box(8.12, 8.20, Y0 + e, Y0 + 0.024, U + 0.20, U + 0.28, O({ mat: 'paint', col: '#f0eee8' }));
  B.cylP([8.16, Y0 + 0.024, U + 0.24], [8.16, Y0 + 0.034, U + 0.24], 0.031, 14, O({ mat: 'paint', col: '#f4f2ec', caps: true }));
  B.cylP([8.53, Y0 + e, U + 1.69], [8.53, Y0 + 0.012, U + 1.69], 0.013, 10, O({ mat: 'metal', col: '#c9ccce', caps: true }));
  B.cylP([8.53, Y0 + 0.012, U + 1.69], [8.54, Y0 + 0.07, U + 1.70], 0.0055, 8, O({ mat: 'metal', col: '#c9ccce' }));
  B.sph(8.54, Y0 + 0.072, U + 1.70, 0.011, 0.011, 0.011, 8, O({ mat: 'metal', col: '#d4d6d8' }));

  B.group = g0;
}
