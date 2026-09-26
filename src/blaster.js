// ---------- Foam-dart blaster: first-person toy blaster, darts with simple physics ----------
// A generic toy blaster (no brand markings). Held in the right hand when walking; darts fly with gravity and drag,
// bounce off walls, furniture, glass and doors, and settle on floors and table tops.
// ctx: { E, mats, P, floorAt(x,y,zmax), surfaces(x,y), boxesNear(x,y), outdoorAt(x,y,z) }

function makeBlaster(ctx) {
  const { E, mats, P } = ctx;
  const MAG = 12, SPEED = 17, GRAV = 9.8, DRAG = 0.55, RAD = 0.008, MAXD = 40, COOL = 0.27;
  const BLUE = '#2e74d8', ORANGE = '#ff7a1a', GREY = '#9aa3ad', DARK = '#2b3036', WHITE = '#eef1f4';

  // ---------- meshes ----------
  const mk = (ext, fn) => { const B = new Builder(); B.mirror = false; B.extF = ext; B.fz = 0; B.cz = 0; B.collide = false; fn(B); return B.finish(E, mats); };
  const gunBody = (B) => {
    const T = (o) => Object.assign({ mat: 'toy' }, o), M = (o) => Object.assign({ mat: 'toyMatte' }, o);
    B.box(-0.075, 0.165, -0.024, 0.024, 0.0, 0.074, T({ col: BLUE }));                         // receiver
    B.box(-0.02, 0.165, -0.02, 0.02, -0.013, 0.0, T({ col: GREY }));                           // lower frame
    for (const s of [-1, 1]) {
      B.box(0.02, 0.15, s > 0 ? 0.0238 : -0.0255, s > 0 ? 0.0255 : -0.0238, 0.034, 0.044, T({ col: ORANGE }));
      B.box(-0.07, -0.008, s > 0 ? 0.0238 : -0.0255, s > 0 ? 0.0255 : -0.0238, 0.012, 0.062, T({ col: WHITE }));
    }
    B.box(0.165, 0.30, -0.021, 0.021, 0.010, 0.068, T({ col: GREY }));                          // barrel shroud
    for (let i = 0; i < 5; i++) B.box(0.18 + i * 0.022, 0.192 + i * 0.022, -0.012, 0.012, 0.068, 0.074, T({ col: DARK }));
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) B.box(0.19 + i * 0.03, 0.208 + i * 0.03, s > 0 ? 0.0205 : -0.0215, s > 0 ? 0.0215 : -0.0205, 0.026, 0.052, T({ col: DARK }));
    B.cylP([0.30, 0, 0.039], [0.327, 0, 0.039], 0.027, 12, T({ col: ORANGE, caps: true }));      // muzzle
    B.cylP([0.327, 0, 0.039], [0.3276, 0, 0.039], 0.0105, 10, T({ col: '#141619', caps: true })); // bore
    B.box(0.285, 0.298, -0.004, 0.004, 0.068, 0.084, T({ col: ORANGE }));                      // front sight
    B.box(-0.03, 0.058, -0.007, 0.007, -0.062, -0.052, T({ col: GREY }));                       // trigger guard
    B.box(0.048, 0.058, -0.007, 0.007, -0.062, -0.013, T({ col: GREY }));
    B.box(0.004, 0.016, -0.005, 0.005, -0.045, -0.013, T({ col: ORANGE }));                      // trigger
    B.box(0.07, 0.135, -0.019, 0.019, -0.016, -0.013, T({ col: '#15171a' }));                  // magazine well
    // grip, raked back, with a blue backstrap
    const az = V3.norm([0.27, 0, 0.963]), ax = V3.norm([0.963, 0, -0.27]), ay = [0, 1, 0];
    const gc = [-0.058, 0, -0.062];
    obox(B, gc, ax, ay, az, [0.026, 0.021, 0.068], M({ col: DARK }));
    obox(B, V3.add(gc, V3.mul(ax, -0.024)), ax, ay, az, [0.007, 0.0215, 0.062], T({ col: BLUE }));
    // gloved hand around the grip, thumb along the left side, sleeve out of view
    const glove = '#22262b';
    obox(B, V3.add(gc, V3.mul(az, -0.004)), ax, ay, az, [0.031, 0.029, 0.046], M({ col: glove }));
    obox(B, V3.add(V3.add(gc, V3.mul(ax, 0.026)), V3.mul(az, -0.006)), ax, ay, az, [0.013, 0.03, 0.043], M({ col: '#2a2f35' }));
    obox(B, [-0.035, -0.029, 0.016], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.03, 0.009, 0.011], M({ col: glove }));
    B.cylP([-0.075, 0.004, -0.108], [-0.12, 0.018, -0.15], 0.036, 10, M({ col: glove }));
    B.cylP([-0.11, 0.015, -0.14], [-0.40, 0.14, -0.32], 0.045, 10, M({ col: '#3e4b5c' }));
  };
  const gunSlide = (B) => {
    const T = (o) => Object.assign({ mat: 'toy' }, o);
    B.box(-0.088, 0.135, -0.027, 0.027, 0.074, 0.100, T({ col: WHITE }));
    for (let i = 0; i < 4; i++) B.box(-0.083 + i * 0.011, -0.077 + i * 0.011, -0.0285, 0.0285, 0.078, 0.097, T({ col: ORANGE }));
    for (const s of [-1, 1]) B.box(-0.086, -0.078, s > 0 ? 0.008 : -0.015, s > 0 ? 0.015 : -0.008, 0.100, 0.108, T({ col: DARK }));
  };
  const gunMag = (B) => {
    const T = (o) => Object.assign({ mat: 'toy' }, o);
    B.box(0.074, 0.131, -0.017, 0.017, -0.115, -0.013, T({ col: '#7d8792' }));
    B.box(0.071, 0.134, -0.019, 0.019, -0.124, -0.115, T({ col: ORANGE }));
  };
  const dartMesh = (B) => {
    const L = 0.085, r = 0.0078;
    B.cylP([-L / 2, 0, 0], [L / 2 - 0.013, 0, 0], r, 8, { mat: 'foam', col: '#2f78e6', caps: true });
    B.cylP([L / 2 - 0.013, 0, 0], [L / 2 - 0.002, 0, 0], r * 1.06, 8, { mat: 'foam', col: ORANGE, caps: true });
    B.sph(L / 2 - 0.002, 0, 0, 0.004, r * 1.02, r * 1.02, 8, { mat: 'foam', col: ORANGE });
    B.cylP([-L / 2 - 0.0005, 0, 0], [-L / 2, 0, 0], r * 0.55, 8, { mat: 'foam', col: '#1b3d78', caps: true });
  };
  const variants = [0, 1].map(ext => ({ body: mk(ext, gunBody), slide: mk(ext, gunSlide), mag: mk(ext, gunMag) }));
  const dartMeshes = [0, 1].map(ext => mk(ext, dartMesh)[0].mesh);
  const foamMat = mats.foam;
  // overlay batches (one set per ext variant), each with its own model matrix
  const parts = variants.map(v => {
    const o = {};
    for (const k of ['body', 'slide', 'mag']) {
      o[k] = { model: M4.create(), batches: v[k].map(g => ({ mesh: g.mesh, mat: g.mat, group: 'overlay', model: null, visible: false })) };
      for (const b of o[k].batches) { b.model = o[k].model; E.overlay.push(b); }
    }
    return o;
  });

  // ---------- state ----------
  const SPARE = 12;
  const S = { enabled: false, active: false, ammo: MAG, spare: SPARE, cool: 0, onEmpty: null, onPick: null, held: false, kick: 0, slideT: 1, reloadT: -1, moved: 0, lx: P.x, ly: P.y, lyaw: P.yaw, lpitch: P.pitch, sway: [0, 0], t: 0, onAmmo: null };
  const darts = [];

  // ---------- audio (shared synthesised kit) ----------
  const burst = (vol, f0, f1, dur, type) => SND.burst(vol, f0, f1, dur, type);
  const thump = (vol) => SND.tone(vol, 190, 70, 0.09);
  const sndFire = () => { burst(0.30, 1900, 450, 0.12); thump(0.22); setTimeout(() => burst(0.10, 3200, 2400, 0.03, 'highpass'), 90); };
  const sndHit = (x, y, z, speed) => { const d = Math.hypot(x - P.x, y - P.y, z - (P.z + P.eye)); burst(Math.min(0.14, speed * 0.012) / (1 + d * 0.5), 2600, 1400, 0.035, 'highpass'); };

  // ---------- geometry helpers ----------
  const gl = (p) => [p[0], p[2], p[1]];                 // plan -> GL
  function viewBasis() {
    const cy = Math.cos(P.yaw), sy = Math.sin(P.yaw), cp = Math.cos(P.pitch), sp = Math.sin(P.pitch);
    const hb = P.hb || [0, 0, 0];
    return { f: [cy * cp, sp, sy * cp], u: [-cy * sp, cp, -sy * sp], r: [-sy, 0, cy], e: [P.x + hb[0], P.z + P.eye + hb[2], P.y + hb[1]] };
  }
  function basisMat(f, u, r, t) { const m = M4.create(); m[0] = f[0]; m[1] = f[1]; m[2] = f[2]; m[4] = u[0]; m[5] = u[1]; m[6] = u[2]; m[8] = r[0]; m[9] = r[1]; m[10] = r[2]; m[12] = t[0]; m[13] = t[1]; m[14] = t[2]; return m; }
  function T(x, y, z) { const m = M4.create(); m[12] = x; m[13] = y; m[14] = z; return m; }
  function RX(a) { const c = Math.cos(a), s = Math.sin(a), m = M4.create(); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; }
  const RY = (a) => M4.rotY(a, 0, 0, 0), RZ = (a) => M4.rotZ(a, 0, 0);
  const xf = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];

  // ---------- world queries for darts ----------
  function solidAt(x, y, z) {
    for (const c of ctx.boxesNear(x, y)) if (x > c.x0 - RAD && x < c.x1 + RAD && y > c.y0 - RAD && y < c.y1 + RAD && z > c.z0 - RAD && z < c.z1 + RAD) return c;
    return null;
  }
  function ceilAt(x, y, z) {
    let best = Infinity;
    for (const s of ctx.surfaces(x, y)) if (s > z + 0.25 && s < best) best = s;
    if (best < Infinity) return best - (best > 1.5 ? 0.26 : 0.32);
    if (x > 1.6 && x < 10.23 && y > 11.99 && y < 21.4 && z > LV.U - 0.5 && z < LV.UC + 0.3) return (x > 6.3 && x < 8.2 && y > 19.96) ? 5.0 : LV.UC;
    return Infinity;
  }
  // distance along a ray to the first thing it meets (for aiming the darts at the crosshair)
  function rayDist(o, d, max) {
    let pz = o[2];
    for (let s = 0.05; s < max; s += 0.05) {
      const x = o[0] + d[0] * s, y = o[1] + d[1] * s, z = o[2] + d[2] * s;
      if (solidAt(x, y, z) || z < ctx.floorAt(x, y, pz + 0.05) || z > ceilAt(x, y, pz)) return s;
      pz = z;
    }
    return max;
  }

  // ---------- darts ----------
  function dartModel(d) {
    let dir = d.rest ? [Math.cos(d.hyaw), 0, Math.sin(d.hyaw)] : V3.norm([d.vx, d.vz, d.vy]);
    let r = V3.cross(dir, [0, 1, 0]); if (Math.hypot(...r) < 1e-4) r = [0, 0, 1]; r = V3.norm(r);
    const u = V3.cross(r, dir);
    d.batch.model.set(basisMat(dir, u, r, [d.x, d.z, d.y]));
  }
  function removeDart(d) {
    const i = E.dynamic.indexOf(d.batch); if (i >= 0) E.dynamic.splice(i, 1);
    const j = darts.indexOf(d); if (j >= 0) darts.splice(j, 1);
  }
  function spawnDart(p, v) {
    if (darts.length >= MAXD) removeDart(darts.find(d => d.rest) || darts[0]);
    const ext = ctx.outdoorAt(p[0], p[1], p[2]) ? 1 : 0;
    const batch = E.addBatch(dartMeshes[ext], foamMat, 'site', M4.create());
    const d = { x: p[0], y: p[1], z: p[2], vx: v[0], vy: v[1], vz: v[2], rest: false, age: 0, bounces: 0, hyaw: Math.atan2(v[1], v[0]), batch, ext };
    darts.push(d); dartModel(d);
  }
  function settle(d, x, y, z) {
    d.rest = true; d.x = x; d.y = y; d.z = z;
    const h = Math.hypot(d.vx, d.vy); if (h > 0.05) d.hyaw = Math.atan2(d.vy, d.vx);
    d.hyaw += (Math.random() - 0.5) * 0.5;
    const ext = ctx.outdoorAt(x, y, z) ? 1 : 0; if (ext !== d.ext) { d.ext = ext; d.batch.mesh = dartMeshes[ext]; }
    dartModel(d);
  }
  function stepDart(d, dt) {
    d.age += dt;
    const n = Math.max(1, Math.ceil(Math.hypot(d.vx, d.vy, d.vz) * dt / 0.04)), h = dt / n;
    for (let i = 0; i < n && !d.rest; i++) {
      const k = Math.exp(-DRAG * h);
      d.vz -= GRAV * h; d.vx *= k; d.vy *= k; d.vz *= Math.exp(-DRAG * 0.4 * h);
      const px = d.x, py = d.y, pz = d.z;
      let x = px + d.vx * h, y = py + d.vy * h, z = pz + d.vz * h;
      const sp = Math.hypot(d.vx, d.vy, d.vz);
      const c = solidAt(x, y, z);
      if (c) {
        if (pz >= c.z1 + RAD - 0.002 && d.vz <= 0) {            // came down onto a table, bed, shelf...
          if (d.vz < -2.5 && d.bounces < 2) { d.vz = -d.vz * 0.2; d.vx *= 0.35; d.vy *= 0.35; d.bounces++; z = c.z1 + RAD; sndHit(x, y, z, sp); }
          else { settle(d, x, y, c.z1 + RAD); sndHit(x, y, z, sp); break; }
        } else if (pz <= c.z0 - RAD + 0.002 && d.vz > 0) { z = c.z0 - RAD; d.vz = -d.vz * 0.3; sndHit(x, y, z, sp); }
        else {
          const inX = px > c.x0 - RAD && px < c.x1 + RAD, inY = py > c.y0 - RAD && py < c.y1 + RAD;
          if (!inX) { x = px; d.vx = -d.vx * 0.08; d.vy *= 0.35; }
          if (!inY) { y = py; d.vy = -d.vy * 0.08; d.vx *= 0.35; }
          if (inX && inY) { x = px; y = py; d.vx = -d.vx * 0.1; d.vy = -d.vy * 0.1; }
          d.vz = Math.min(d.vz * 0.4, 0.5); sndHit(x, y, z, sp);
        }
      }
      const f = ctx.floorAt(x, y, pz + 0.05);
      if (z < f + RAD) {
        if (d.vz < -2.5 && d.bounces < 2) { d.vz = -d.vz * 0.22; d.vx *= 0.35; d.vy *= 0.35; d.bounces++; z = f + RAD; sndHit(x, y, z, sp); }
        else { settle(d, x, y, f + RAD); sndHit(x, y, z, sp); break; }
      }
      const cz = ceilAt(x, y, pz);
      if (z > cz - RAD) { z = cz - RAD; d.vz = -Math.abs(d.vz) * 0.3; sndHit(x, y, z, sp); }
      d.x = x; d.y = y; d.z = z;
    }
    if (!d.rest) {
      if (d.z < -12 || d.age > 8) { removeDart(d); return; }
      dartModel(d);
    }
  }

  // ---------- actions ----------
  function setAmmo(n) { S.ammo = n; if (S.onAmmo) S.onAmmo(S.ammo, MAG, S.reloadT >= 0, S.spare); }
  // reloading only happens when asked (R), and only from the darts you carry
  function reload() {
    if (!S.active || S.reloadT >= 0 || S.ammo === MAG) return;
    if (S.spare <= 0) { if (S.onEmpty) S.onEmpty('nospare'); return; }
    S.reloadT = 0; burst(0.08, 2600, 1800, 0.03, 'highpass'); setAmmo(S.ammo);
  }
  function fire() {
    if (!S.active || S.reloadT >= 0 || S.cool > 0) return false;
    if (S.ammo <= 0) { burst(0.07, 3000, 2600, 0.02, 'highpass'); S.cool = COOL; if (S.onEmpty) S.onEmpty(S.spare > 0 ? 'reload' : 'nodarts'); S.held = false; return false; }
    S.cool = COOL; S.kick = 1; S.slideT = 0; setAmmo(S.ammo - 1);
    // muzzle position from the current gun matrix, aimed at what the crosshair covers
    const vb = viewBasis(), g = parts[S.ext || 0].body.model, mz = xf(g, [0.335, 0.039, 0]);
    const eye = [vb.e[0], vb.e[2], vb.e[1]], fwd = [vb.f[0], vb.f[2], vb.f[1]];
    // converge on the crosshair, but never steeper than for a target 3 m away (point-blank shots fly straight)
    const D = Math.max(3, rayDist(eye, fwd, 30)), tgt = [eye[0] + fwd[0] * D, eye[1] + fwd[1] * D, eye[2] + fwd[2] * D];
    // the blaster is drawn with its own lens: start the dart where the muzzle shows on screen in the room's lens
    const k = P.fovK || 1, rel = V3.sub([mz[0], mz[2], mz[1]], eye), up = [vb.u[0], vb.u[2], vb.u[1]], rt = [vb.r[0], vb.r[2], vb.r[1]];
    const cf = V3.dot(rel, fwd), cu = V3.dot(rel, up), cr = V3.dot(rel, rt);
    const m = V3.add(V3.add(V3.add(eye, V3.mul(fwd, cf)), V3.mul(up, cu * k)), V3.mul(rt, cr * k));
    let dir = V3.norm(V3.sub(tgt, m));
    dir = V3.norm([dir[0] + (Math.random() - 0.5) * 0.025, dir[1] + (Math.random() - 0.5) * 0.025, dir[2] + (Math.random() - 0.5) * 0.02 + 0.01]);
    // standing close to a wall: the muzzle may be inside or beyond it, so start the dart just in front of the wall
    let start = m;
    const toM = V3.sub(m, eye), L = Math.hypot(...toM), dm = rayDist(eye, V3.mul(toM, 1 / L), L);
    if (dm < L) start = V3.add(eye, V3.mul(toM, Math.max(0.02, dm - 0.06) / L));
    spawnDart(start, V3.mul(dir, SPEED));
    sndFire();
    return true;
  }
  function trigger(on) { S.held = on; if (on) fire(); }
  function clear() { while (darts.length) removeDart(darts[0]); }
  function setEnabled(on) {
    S.enabled = on;
    if (!on) { clear(); S.held = false; S.reloadT = -1; S.spare = SPARE; setAmmo(MAG); }
  }

  // ---------- per frame ----------
  function update(dt, walking, outdoor) {
    S.t += dt;
    const active = S.enabled && walking;
    if (active && !S.active) { S.lx = P.x; S.ly = P.y; S.lyaw = P.yaw; S.lpitch = P.pitch; }
    S.active = active;
    for (const d of darts.slice()) if (!d.rest) stepDart(d, dt);
    const ext = outdoor ? 1 : 0; S.ext = ext;
    for (let i = 0; i < 2; i++) for (const k in parts[i]) for (const b of parts[i][k].batches) b.visible = active && i === ext;
    if (!active) { S.held = false; return; }
    // walk over darts (or reach them on a low surface) to pick them up
    let got = 0;
    for (const d of darts.slice()) if (d.rest && Math.hypot(d.x - P.x, d.y - P.y) < 0.45 && d.z > P.z - 0.3 && d.z < P.z + 1.25) { removeDart(d); S.spare++; got++; }
    if (got) { SND.tone(0.08, 900, 1400, 0.06, 'triangle'); setAmmo(S.ammo); if (S.onPick) S.onPick(got); }
    // timers
    S.cool = Math.max(0, S.cool - dt);
    if (S.held && S.cool <= 0) fire();
    S.kick *= Math.exp(-12 * dt);
    if (S.slideT < 1) { const was = S.slideT; S.slideT = Math.min(1, S.slideT + dt / 0.17); if (was < 0.5 && S.slideT >= 0.5) burst(0.06, 2400, 1600, 0.025, 'highpass'); }
    if (S.reloadT >= 0) {
      const was = S.reloadT; S.reloadT += dt / 1.1;
      if (was < 0.55 && S.reloadT >= 0.55) { burst(0.09, 2200, 1500, 0.04, 'highpass'); }
      if (S.reloadT >= 1) { S.reloadT = -1; const n = Math.min(MAG - S.ammo, S.spare); S.spare -= n; setAmmo(S.ammo + n); }
    }
    // walk bob and look sway
    const mv = Math.hypot(P.x - S.lx, P.y - S.ly); S.moved += mv; S.lx = P.x; S.ly = P.y;
    let dyaw = P.yaw - S.lyaw; S.lyaw = P.yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
    const dp = P.pitch - S.lpitch; S.lpitch = P.pitch;
    const k = 1 - Math.exp(-10 * dt), cl = (v) => Math.max(-0.06, Math.min(0.06, v));
    S.sway[0] += (cl(-dyaw / Math.max(dt, 1e-3) * 0.012) - S.sway[0]) * k;
    S.sway[1] += (cl(dp / Math.max(dt, 1e-3) * 0.012) - S.sway[1]) * k;
    const ph = S.moved * 4.36, walkAmt = Math.min(1, mv / Math.max(dt, 1e-3) / 1.4);
    const bobY = -0.006 * Math.abs(Math.sin(ph)) * walkAmt + 0.0018 * Math.sin(S.t * 1.6);
    const bobZ = 0.005 * Math.sin(ph) * walkAmt;
    // reload pose
    let rl = 0, magY = 0;
    if (S.reloadT >= 0) { const t = S.reloadT; rl = Math.sin(Math.PI * Math.min(1, t)); magY = -0.26 * Math.sin(Math.PI * Math.min(1, t / 0.9)); }
    const vb = viewBasis(), W = basisMat(vb.f, vb.u, vb.r, vb.e);
    const off = T(0.40 - 0.035 * S.kick, -0.188 + bobY - 0.05 * rl, 0.158 + bobZ);
    let G = M4.mul(W, off);
    G = M4.mul(G, RY(0.045 + S.sway[0]));
    G = M4.mul(G, RZ(0.035 + 0.14 * S.kick + S.sway[1] + 0.12 * rl));
    G = M4.mul(G, RX(0.08 - 0.5 * rl));
    const p = parts[ext];
    p.body.model.set(G);
    p.slide.model.set(M4.mul(G, T(-0.048 * Math.sin(Math.PI * S.slideT), 0, 0)));
    p.mag.model.set(M4.mul(G, T(0, magY, 0)));
  }

  return { S, darts, update, fire, trigger, reload, setEnabled, clear, get enabled() { return S.enabled; }, get active() { return S.active; }, MAG };
}
