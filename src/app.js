// ---------- Application ----------
setTimeout(function () {
  const $ = (id) => document.getElementById(id);
  const canvas = $('gl');
  let E;
  try { E = new Engine(canvas); } catch (e) { $('boot').hidden = true; $('nogl').hidden = false; console.error(e); return; }
  const gl = E.gl;

  // ---- materials ----
  const texCache = {};
  const tex = (name) => { if (!texCache[name]) { const t = TEX[name](); texCache[name] = { t: E.texture(t.c, { clamp: t.clamp, aniso: 8 }), u: t.u, v: t.v }; } return texCache[name]; };
  const M = (t, o = {}) => { const T = tex(t); return Object.assign({ tex: T.t, uvScale: new Float32Array([1 / T.u, 1 / T.v]), tint: new Float32Array(o.tint || [1, 1, 1]), spec: 0.04, shin: 12, alpha: 1, emis: 0, refl: 0, transparent: false, cull: true, castShadow: true, alphaTest: 0 }, o, { tint: new Float32Array(o.tint || [1, 1, 1]) }); };
  const mats = {
    brick: M('brick', { spec: 0.05, shin: 10 }), brickIn: M('brick', { spec: 0.05, tint: [0.50, 0.36, 0.32] }), doorLeaf: M('woodDarkV', { spec: 0.22, shin: 30 }), woodClad: M('woodClad', { spec: 0.06, shin: 12 }),
    plaster: M('plaster', { tint: [0.86, 0.855, 0.84] }), ceiling: M('plaster', { tint: [0.88, 0.88, 0.87] }),
    soffitP: M('plaster', { tint: [0.80, 0.74, 0.64] }), soffit: M('woodDark', { tint: [0.55, 0.55, 0.55] }), fascia: M('woodDark', { tint: [0.45, 0.45, 0.45] }),
    floorGF: M('floorGF', { spec: 0.30, shin: 45, refl: 0.10 }), carpet: M('carpet'), deck: M('deck', { spec: 0.05 }),
    roof: M('roof', { spec: 0.14, shin: 22 }), roofRed: M('roof', { tint: [2.2, 1.35, 1.0] }), grass: M('grass'), pavers: M('pavers'), gravel: M('gravel'), grassPaver: M('grassPaver'),
    concrete: M('concrete'), asphalt: M('asphalt', { spec: 0.05 }), render: M('plaster', { tint: [0.95, 0.93, 0.9] }),
    zellige: M('zellige', { spec: 0.55, shin: 70, refl: 0.18 }), bathTile: M('bathTile', { spec: 0.45, shin: 60, refl: 0.12 }), bathFloor: M('bathFloor', { spec: 0.3, shin: 40 }), bTile: M('bTile', { spec: 0.25 }),
    balconyTile: M('bathFloor', { tint: [0.85, 0.85, 0.85] }),
    woodLight: M('woodLight', { spec: 0.22, shin: 30 }), woodDark: M('woodDark', { spec: 0.2, shin: 30 }), oak: M('oak', { spec: 0.2, shin: 25 }),
    paint: M('white', { spec: 0.12, shin: 20 }), gloss: M('white', { spec: 0.7, shin: 90, refl: 0.2 }), metal: M('white', { spec: 0.9, shin: 60, refl: 0.35 }),
    zinc: M('white', { spec: 0.35, shin: 25 }), fabric: M('fabric', { spec: 0.02 }), trunk: M('woodDark', { tint: [0.8, 0.7, 0.6] }),
    louver: M('louver', { spec: 0.1 }), foliage: M('foliage', { spec: 0.03 }), art: M('art', { spec: 0.15, shin: 40 }), games: M('games'), books: M('books'),
    rug: M('rug'), hob: M('hob', { spec: 0.9, shin: 120, refl: 0.3 }), oven: M('oven', { spec: 0.6, shin: 60 }), garageDoor: M('garage', { spec: 0.2 }),
    emissive: M('white', { emis: 1.05 }), mirror: M('mirror', { spec: 1.0, shin: 200, refl: 0.25 }),
    glass: M('white', { glass: 1, tint: [0.55, 0.62, 0.64], alpha: 0.10, spec: 1.6, shin: 220, refl: 0.55, transparent: true, cull: false, castShadow: false }),
    glassNb: M('white', { glass: 2, tint: [0.10, 0.12, 0.13], alpha: 0.96, spec: 1.6, shin: 220, refl: 0.6, transparent: true, cull: false }),
    curtain: M('curtain', { transparent: true, cull: false, castShadow: false, alpha: 0.85 }),
    bamboo: M('bamboo', { transparent: true, cull: false, alpha: 0.95 }), poly: M('white', { tint: [0.85, 0.88, 0.85], alpha: 0.28, transparent: true, cull: false, spec: 0.8, shin: 80, castShadow: false }),
    fence: M('fence', { cull: false, alphaTest: 0.5 }), fenceBoard: M('fenceBoard', { spec: 0.05, shin: 10 }), plinthBlock: M('plinthBlock', { spec: 0.04 }),
    euroMesh: M('euroMesh', { spec: 0.35, shin: 30, transparent: true, cull: false, alphaTest: 0.02, castShadow: false }),
    clayRoof: M('clayTile', { spec: 0.10, shin: 18 }), solar: M('solar', { spec: 0.9, shin: 90, refl: 0.3 }),
    blueConcrete: M('concrete', { tint: [0.60, 0.72, 1.22] }), coping: M('concrete', { tint: [0.92, 0.94, 0.95] }), stoneCap: M('concrete', { tint: [1.85, 1.75, 1.55] }),
    slatWood: M('woodDark', { tint: [0.30, 0.27, 0.26], spec: 0.08, shin: 14 }), plate: M('plate', { spec: 0.7, shin: 60, refl: 0.2 }), grate: M('grate', { cull: false, alphaTest: 0.5 }),
    deskMatte: M('deskAtlas', { spec: 0.14, shin: 30 }), deskGloss: M('deskAtlas', { spec: 1.0, shin: 140, refl: 0.22 }), memo: M('memo', { spec: 0.18, shin: 50 }),
    leaf: M('leaves', { cull: false, alphaTest: 0.5, spec: 0.12, shin: 24 }), birch: M('oak', { tint: [1.18, 1.19, 1.16], spec: 0.15, shin: 25 }),
    drape: M('fabric', { cull: false, spec: 0.03 }), shade: M('nymo', { spec: 0.35, shin: 30 }), sheet: M('sheet', { spec: 0.04 }), pierArt: M('pierArt', { spec: 0.08, shin: 20 }), doorWarm: M('woodWarmV', { spec: 0.22, shin: 30, tint: [0.64, 0.48, 0.36] }),
    ubTile: M('ubTile', { spec: 0.45, shin: 60, refl: 0.10, tint: [0.93, 0.93, 0.93] }), ubFloor: M('ubFloor', { spec: 0.35, shin: 55, refl: 0.10 }),
    cabWood: M('cabWood', { spec: 0.16, shin: 26 }), kidArt: M('kidArt', { spec: 0.05 }), tent: M('tentSea', { spec: 0.10, shin: 20, cull: false }),
    fireFront: M('fireFront', { spec: 0.06, shin: 14 }), fireBrick: M('fireBrick', { spec: 0.06, shin: 14 }),
    toy: M('white', { spec: 0.34, shin: 40, castShadow: false }), toyMatte: M('white', { spec: 0.05, shin: 10, castShadow: false }), foam: M('white', { spec: 0.04, shin: 8, castShadow: false })
  };

  // ---- build scene ----
  const B = new Builder();
  buildExterior(B, false);
  buildExterior(B, true);
  B.mirror = false;
  buildInterior(B);
  buildDeskCorner(B);
  buildRearBedroom(B);
  buildUpperBath(B);
  buildFrontBedroom(B);
  buildLivingCorner(B);
  buildSite(B);
  buildDoors(B);
  B.mirror = false;
  const groups = { site: [], nb: [], basement: [], ground: [], upper: [], roof: [] };
  let triCount = 0;
  for (const g of B.finish(E, mats)) { const b = E.addBatch(g.mesh, g.mat, g.group); (groups[g.group] || groups.site).push(b); triCount += g.tris; }
  // doors
  const doors = [];
  for (const d of B.doorDefs) {
    const model = M4.create();
    const bs = d.builder.finish(E, mats).map(g => { const b = E.addBatch(g.mesh, g.mat, d.group, model); groups[d.group].push(b); triCount += g.tris; return b; });
    // conservative bounds covering every position of the part, so off-screen parts are skipped
    if (!d.garage && bs.length) {
      const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
      for (const b of bs) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], b.mesh.min[k]); mx[k] = Math.max(mx[k], b.mesh.max[k]); }
      let r = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) + 0.1;
      if (d.scaleY) r = Math.max(r, (mx[2] - mn[2]) * d.scaleY.k + 0.1);
      const cull = [mn.map(v => v - r), mx.map(v => v + r)];
      for (const b of bs) b.cull = cull;
      if (d.mover && !d.tilt && !d.scaleY) { const nc = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2]; for (const b of bs) b.near = nc; }
    }
    const door = Object.assign({}, d, { model, batches: bs, t: d.startOpen ? 1 : 0, target: d.startOpen ? 1 : 0 });
    doors.push(door); setDoorMatrix(door);
  }
  function setDoorMatrix(d) {
    const e = d.t < 0.5 ? 2 * d.t * d.t : 1 - Math.pow(-2 * d.t + 2, 2) / 2;
    let m;
    if (d.garage) m = M4.rotZ(d.openAngle * e, 1.80, -0.53);
    else if (d.slide) { m = M4.create(); m[12] = d.slide[0] * e; m[14] = d.slide[1] * e; }
    else if (d.tilt) m = d.tilt.axis === 'x' ? M4.rotZ(d.tilt.ang * e, d.tilt.p[0], d.tilt.p[1]) : M4.rotX(d.tilt.ang * e, d.tilt.p[0], d.tilt.p[1]);
    else if (d.scaleY) { m = M4.create(); const sc = 1 + (d.scaleY.k - 1) * e; m[10] = sc; m[14] = d.scaleY.pivot * (1 - sc); }
    else m = M4.rotY(d.openAngle * e, d.hinge[0], 0, d.hinge[1]);
    d.model.set(m);
  }
  const colliders = B.colliders, walks = B.walk;
  window.__stats = { tris: triCount, batches: E.batches.length + E.dynamic.length, colliders: colliders.length, walks: walks.length };

  // ---- spatial grid ----
  const CELL = 1.0, grid = new Map(), wgrid = new Map();
  const key = (i, j) => i * 100003 + j;
  const insert = (g, o) => { for (let i = Math.floor(o.x0 / CELL); i <= Math.floor(o.x1 / CELL); i++) for (let j = Math.floor(o.y0 / CELL); j <= Math.floor(o.y1 / CELL); j++) { const k = key(i, j); let a = g.get(k); if (!a) g.set(k, a = []); a.push(o); } };
  for (const c of colliders) insert(grid, c);
  for (const w of walks) insert(wgrid, w);
  const near = (g, x, y) => g.get(key(Math.floor(x / CELL), Math.floor(y / CELL))) || [];
  const pip = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if (((a[1] > y) !== (b[1] > y)) && (x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0])) c = !c; } return c; };
  const inPatch = (w, x, y) => x >= w.x0 && x <= w.x1 && y >= w.y0 && y <= w.y1 && (!w.poly || pip(w.poly, x, y));
  function surfaces(x, y) {
    const out = [];
    for (const w of near(wgrid, x, y)) if (inPatch(w, x, y)) out.push(w.z);
    if (inRamp(x, y)) out.push(rampH(x)); else if (!inHole(x, y)) out.push(terrainH(x, y));
    return out;
  }
  function floorAt(x, y, zmax) { let best = -Infinity; for (const z of surfaces(x, y)) if (z <= zmax && z > best) best = z; return best; }

  // ---- player ----
  const P = { x: -10.2, y: 20.8, z: -0.645, yaw: 0, pitch: -0.05, vz: 0, vx: 0, vy: 0, r: 0.22, eye: 1.62, hb: [0, 0, 0] };
  const START = {
    street: { x: -14.2, y: 16.3, yaw: -0.02, pitch: 0.04, label: 'Street' },
    ground: { x: 7.33, y: 18.85, yaw: -Math.PI / 2, pitch: -0.10, label: 'Ground floor' },
    upper: { x: 6.0, y: 19.35, yaw: -Math.PI / 2, pitch: -0.06, label: 'Upper floor' },
    basement: { x: 7.0, y: 19.4, yaw: -Math.PI / 2, pitch: -0.05, label: 'Basement' },
    garden: { x: 19.0, y: 17.0, yaw: Math.PI + 0.25, pitch: 0.02, label: 'Garden' }
  };
  const LEVELZ = { street: 0.5, ground: 0.4, upper: 3.3, basement: -2.2, garden: 0.2 };
  function teleport(name) {
    const s = START[name]; P.x = s.x; P.y = s.y; P.yaw = s.yaw; P.pitch = s.pitch; P.vz = 0; P.vx = P.vy = 0; pose = null; crouch = false;
    const f = floorAt(P.x, P.y, LEVELZ[name]); P.z = isFinite(f) ? f : 0;
    setMode('walk');
  }
  // yaw: 0 = looking +x (plan). forward vector in plan = (cos yaw, sin yaw)
  const keys = new Set();
  let mode = 'intro';
  const hitWall = (x, y, z0, z1) => {
    const out = [];
    for (let i = Math.floor((x - 0.5) / CELL); i <= Math.floor((x + 0.5) / CELL); i++) for (let j = Math.floor((y - 0.5) / CELL); j <= Math.floor((y + 0.5) / CELL); j++) {
      const a = grid.get(key(i, j)); if (a) for (const c of a) if (c.z1 > z0 && c.z0 < z1) out.push(c);
    }
    for (const d of doors) if (d.box && d.t < 0.05 && d.box.z1 > z0 && d.box.z0 < z1) out.push(d.box);
    return out;
  };
  function resolve(x, y) {
    const cs = hitWall(x, y, P.z + 0.32, P.z + 1.72);
    for (let it = 0; it < 3; it++) {
      let moved = false;
      for (const c of cs) {
        const cx = Math.max(c.x0, Math.min(x, c.x1)), cy = Math.max(c.y0, Math.min(y, c.y1));
        let dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
        if (d < P.r) {
          if (d < 1e-6) { // centre inside box: push along smallest axis
            const pl = [x - c.x0, c.x1 - x, y - c.y0, c.y1 - y], m = Math.min(...pl), k = pl.indexOf(m);
            if (k === 0) x = c.x0 - P.r; else if (k === 1) x = c.x1 + P.r; else if (k === 2) y = c.y0 - P.r; else y = c.y1 + P.r;
          } else { const push = (P.r - d) / d; x += dx * push; y += dy * push; }
          moved = true;
        }
      }
      if (!moved) break;
    }
    return [x, y];
  }
  function blockedBySurface(x, y) { // a raised surface (deck, step too tall) or no floor
    let ok = false;
    for (const z of surfaces(x, y)) { if (z > P.z + 0.42 && z < P.z + 1.7) return true; if (z <= P.z + 0.42) ok = true; }
    return !ok;
  }
  // walking pace like a real person: about 1.3 m/s, a brisk jog with Shift, slow when crouching
  const WALK = 1.3, RUN = 2.8;
  let bobW = 0;
  function move(dt) {
    const fwd = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) + touchMove.f;
    const str = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0) + touchMove.s;
    const turn = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
    P.yaw += turn * dt * 1.8;
    if (pose) { P.vx = P.vy = 0; P.hb = [0, 0, 0]; bobW = 0; if ((fwd || str) && pose.t >= 1 && pose.dir === 1) leavePose(); return; }
    if (dt <= 1e-4) return;
    // eye height: standing or crouching, adult or child
    const eyeT = crouch ? eyeCrouch() : eyeStand();
    P.eye += (eyeT - P.eye) * (1 - Math.exp(-10 * dt));
    const x0 = P.x, y0 = P.y;
    const running = (keys.has('ShiftLeft') || keys.has('ShiftRight')) && !crouch;
    const vmax = crouch ? WALK * 0.45 : running ? RUN : child ? WALK * 0.9 : WALK;
    let dx = Math.cos(P.yaw) * fwd - Math.sin(P.yaw) * str, dy = Math.sin(P.yaw) * fwd + Math.cos(P.yaw) * str;
    const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    // body inertia: speed builds up over the first step (~0.5 s) and runs out within a step when you stop;
    // a change of direction is quicker, so turning while walking does not drift
    const tx = dx * vmax, ty = dy * vmax;
    let ex = tx - P.vx, ey = ty - P.vy;
    const tl = Math.hypot(tx, ty);
    const lim = (vx, vy, rate, amax) => { let ax = vx * (1 - Math.exp(-rate * dt)), ay = vy * (1 - Math.exp(-rate * dt)); const m = Math.hypot(ax, ay), c = amax * dt; if (m > c) { ax *= c / m; ay *= c / m; } return [ax, ay]; };
    if (tl > 1e-6) {
      const ux = tx / tl, uy = ty / tl, al = ex * ux + ey * uy, px = ex - al * ux, py = ey - al * uy;
      const [ax1, ay1] = lim(al * ux, al * uy, al > 0 ? 7 : 9, al > 0 ? (running ? 4.2 : 3.2) : 5.5);
      const [ax2, ay2] = lim(px, py, 12, 7.5);
      P.vx += ax1 + ax2; P.vy += ay1 + ay2;
    } else {
      const [ax, ay] = lim(ex, ey, 9, 5.5); P.vx += ax; P.vy += ay;
      if (Math.hypot(P.vx, P.vy) < 0.02) P.vx = P.vy = 0;
    }
    const vl = Math.hypot(P.vx, P.vy);
    if (vl > 0) {
      const total = vl * dt, steps = Math.max(1, Math.ceil(total / 0.08)), sx = P.vx * dt / steps, sy = P.vy * dt / steps;
      for (let s = 0; s < steps; s++) {
        let nx = P.x + sx, ny = P.y + sy;
        [nx, ny] = resolve(nx, ny);
        if (blockedBySurface(nx, ny)) {
          // try sliding along axes
          if (!blockedBySurface(nx, P.y)) ny = P.y; else if (!blockedBySurface(P.x, ny)) nx = P.x; else { nx = P.x; ny = P.y; }
        }
        P.x = nx; P.y = ny;
        const f = floorAt(P.x, P.y, P.z + 0.42);
        if (isFinite(f)) { if (f >= P.z - 0.3) { P.z = f; P.vz = 0; } }
      }
      // walked into something: the body stops (or slides along it) instead of storing speed
      const mx = (P.x - x0) / dt, my = (P.y - y0) / dt, ml = Math.hypot(mx, my);
      if (ml < vl * 0.95) { P.vx = mx; P.vy = my; }
    }
    // gravity
    const f = floorAt(P.x, P.y, P.z + 0.02);
    if (P.z > f + 0.001) { P.vz -= 9.8 * dt; P.z = Math.max(f, P.z + P.vz * dt); if (P.z <= f) P.vz = 0; }
    // footsteps, by floor type
    const moved = Math.hypot(P.x - x0, P.y - y0), fast = running && vl > 2.0, stride = crouch ? 0.45 : fast ? 0.95 : child ? 0.55 : 0.72;
    if (moved > 0.0005 && P.vz === 0) {
      stepAcc += moved;
      if (stepAcc >= stride) { stepAcc -= stride; footSide = -footSide; SND.step(groundKind(), footSide * 0.12, (crouch ? 0.45 : fast ? 1.25 : child ? 0.8 : 1) * Math.min(1, 0.4 + vl / vmax * 0.6)); }
    } else stepAcc = Math.min(stepAcc, stride * 0.55);
    // a very slight head bob: lowest as each foot lands, a touch of side-to-side sway over two steps
    const ph = Math.min(1, stepAcc / stride), A = crouch ? 0.005 : fast ? 0.016 : child ? 0.009 : 0.011;
    bobW += (Math.min(1, vl / 1.1) * (P.vz === 0 ? 1 : 0) - bobW) * (1 - Math.exp(-8 * dt));
    const bz = -A * bobW * (1 + Math.cos(2 * Math.PI * ph)) / 2, bs = footSide * A * 0.45 * bobW * Math.sin(Math.PI * ph);
    P.hb = window.__nobob ? [0, 0, 0] : [-Math.sin(P.yaw) * bs, Math.cos(P.yaw) * bs, bz];
    P.x = Math.max(-40, Math.min(60, P.x)); P.y = Math.max(-20, Math.min(45, P.y));
  }

  // ---- overview orbit ----
  const O = { az: 2.25, el: 0.36, dist: 27, tx: 6.2, ty: 15.5, tz: 2.2, cut: 'all' };
  function applyCut() {
    const hide = { all: [], upper: ['roof'], ground: ['roof', 'upper'], basement: ['roof', 'upper', 'ground'] }[mode === 'overview' ? O.cut : 'all'];
    for (const g in groups) for (const b of groups[g]) b.visible = !hide.includes(g);
  }

  // ---- camera ----
  const cam = { fov: 70 * Math.PI / 180, near: 0.05, far: 420, eye: [0, 0, 0], target: [0, 0, 0] };
  let wideView = false;
  try { wideView = localStorage.getItem('kh-wide') === '1'; } catch (e) {}
  function updateCam() {
    if (mode === 'overview' || mode === 'intro') {
      const cx = O.tx + Math.cos(O.az) * Math.cos(O.el) * O.dist, cy = O.ty + Math.sin(O.az) * Math.cos(O.el) * O.dist, cz = O.tz + Math.sin(O.el) * O.dist;
      cam.eye = [cx, cz, cy]; cam.target = [O.tx, O.tz, O.ty]; cam.fov = 50 * Math.PI / 180; cam.near = 0.3;
    } else {
      const e = pose ? pose.eye : [P.x + P.hb[0], P.y + P.hb[1], P.z + P.eye + P.hb[2]];
      cam.eye = [e[0], e[2], e[1]];
      cam.target = [e[0] + Math.cos(P.yaw) * Math.cos(P.pitch), e[2] + Math.sin(P.pitch), e[1] + Math.sin(P.yaw) * Math.cos(P.pitch)];
      // natural view: about 80° across (like a 22 mm lens); the wide view is about 100° across
      const asp = canvas.clientWidth / Math.max(1, canvas.clientHeight), hf = (wideView ? 100 : 80) * Math.PI / 360;
      const vf = Math.max(50 * Math.PI / 180, Math.min(80 * Math.PI / 180, 2 * Math.atan(Math.tan(hf) / Math.max(0.5, asp))));
      cam.fov = window.__fov ? window.__fov * Math.PI / 180 : vf; cam.near = 0.05;
      cam.vmFov = 72 * Math.PI / 180; // the hand-held blaster keeps its own lens so it looks the same in either view
      P.fovK = Math.tan(cam.fov / 2) / Math.tan(cam.vmFov / 2);
    }
  }

  // ---- lighting ----
  E.setSun([-0.55, 0.62, 0.56]); // from street side + south, afternoon
  E.shadowCenter = [8, 0, 12]; E.shadowRadius = 26;
  const env = { sunCol: [2.55, 2.32, 2.02], sky: [0.42, 0.50, 0.62], gnd: [0.26, 0.25, 0.22], inTop: [0.68, 0.665, 0.64], inBot: [0.47, 0.46, 0.44], fog: [0.80, 0.85, 0.90], fogD: 0.0022, exposure: 1.0 };
  try { const b = parseFloat(localStorage.getItem('kh-bright')); if (b >= 0.6 && b <= 1.3) env.exposure = b; } catch (e) {}

  // ---- quality ----
  const QUAL = {
    smooth: { scale: 0.72, shadow: false, label: 'Smooth' },
    balanced: { scale: 1.0, shadow: true, label: 'Balanced' },
    sharp: { scale: Math.min(window.devicePixelRatio || 1, 1.6), shadow: true, label: 'Sharp' }
  };
  let quality = 'balanced';
  try { const q = localStorage.getItem('kh-quality'); if (q && QUAL[q]) quality = q; } catch (e) {}
  function setQuality(q) {
    quality = q; E.shadowOn = QUAL[q].shadow; E.shadowDirty = true; resize();
    document.querySelectorAll('[data-q]').forEach(b => b.setAttribute('aria-pressed', b.dataset.q === q ? 'true' : 'false'));
    try { localStorage.setItem('kh-quality', q); } catch (e) {}
  }
  function resize() {
    const s = QUAL[quality].scale, w = Math.max(1, Math.floor(canvas.clientWidth * s)), h = Math.max(1, Math.floor(canvas.clientHeight * s));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }
  window.addEventListener('resize', resize);

  // ---- rooms / HUD ----
  const ROOMS = [
    ['Garage', 'B', 1.93, 8.53, 12.26, 17.81, '36.76 m²'], ['Storage and utility', 'B', 2.93, 6.20, 18.06, 20.96, '7.41 m²'], ['Basement lobby', 'B', 6.00, 8.24, 18.06, 20.96, '6.61 m²'], ['Staircase', 'B', 8.24, 10.23, 18.06, 19.96, ''],
    ['Living room', 'G', 1.98, 6.08, 12.23, 17.81, '23.14 m²'], ['Dining area', 'G', 6.08, 8.48, 12.23, 15.26, '7.56 m²'], ['Kitchen', 'G', 6.18, 8.48, 15.26, 17.91, '5.86 m²'],
    ['Entrance lobby', 'G', 3.05, 4.80, 18.06, 19.96, '3.40 m²'], ['WC', 'G', 4.33, 6.335, 19.96, 20.96, '1.80 m²'], ['Pantry', 'G', 6.585, 8.165, 19.96, 20.96, '1.42 m²'],
    ['Hall', 'G', 4.80, 7.78, 17.81, 19.96, '5.56 m²'], ['Staircase', 'G', 7.78, 10.23, 18.06, 19.96, '4.23 m²'],
    ['Front bedroom', 'U', 1.98, 5.98, 12.17, 15.32, '11.49 m²'], ['Small bedroom', 'U', 1.98, 5.16, 15.42, 17.82, '7.80 m²'], ['Shower room', 'U', 1.98, 5.16, 18.07, 19.96, ''],
    ['Landing', 'U', 5.26, 6.64, 14.02, 18.06, '5.64 m²'], ['Staircase', 'U', 8.20, 10.23, 18.06, 19.96, '4.32 m²'], ['Work corner', 'U', 6.765, 8.16, 19.96, 20.96, ''], ['Landing', 'U', 5.26, 8.20, 18.06, 20.96, '7.07 m²'],
    ['Rear bedroom', 'U', 6.08, 9.86, 12.17, 15.94, '12.36 m²'], ['Bathroom', 'U', 6.74, 9.86, 16.04, 17.82, ''], ['Balcony', 'U', 3.90, 6.37, 20.34, 21.42, ''],
    ['Street terrace', 'O', 0.07, 1.60, 12.35, 19.47, '11.40 m²'], ['Entrance porch', 'O', 1.60, 2.67, 18.19, 20.34, ''], ['Garden terrace', 'O', 8.86, 11.63, 12.21, 18.10, ''],
    ['Driveway ramp', 'O', -11.3, 1.68, 12.61, 17.86, '']
  ];
  const LEVELNAME = { B: ['Basement', '−2.59'], G: ['Ground floor', '±0.00'], U: ['Upper floor', '+2.88'], O: ['Outside', ''] };
  function whereAmI() { return whereAt(P.x, P.y, P.z); }
  function whereAt(x, y, z) {
    const lv = z < -1.3 ? 'B' : z < 1.6 ? 'G' : 'U';
    const inR = (r, m = 0) => x >= r[2] - m && x <= r[3] + m && y >= r[4] - m && y <= r[5] + m;
    for (const r of ROOMS) if (r[1] === lv && inR(r)) return { name: r[0], area: r[6], lv };
    for (const r of ROOMS) if (r[1] === lv && inR(r, 0.3)) return { name: r[0], area: r[6], lv };
    for (const r of ROOMS) if (r[1] === 'O' && inR(r)) return { name: r[0], area: r[6], lv: 'O' };
    let n = 'Garden';
    if (y < 11.988) n = "Neighbour's side"; else if (x < -11.3) n = 'Street'; else if (x < 0.5) n = 'Front garden'; else if (y > 20.3 && x < 11.7) n = 'Side path';
    return { name: n, area: '', lv: 'O' };
  }
  let lastRoom = '';
  function updateHud() {
    const w = whereAmI(), s = w.name + '|' + w.lv;
    if (s !== lastRoom) {
      lastRoom = s; $('roomName').textContent = w.name; $('roomArea').textContent = w.area;
      const L = LEVELNAME[w.lv]; $('levelName').textContent = L[0]; $('levelZ').textContent = L[1] ? L[1] + ' m' : '';
      mapLevel = w.lv; drawMapBase();
    }
  }

  // ---- things to use with E: doors, cabinet doors, drawers, boxes, windows, curtains, seats, beds, the KURA ladder ----
  let child = false, crouch = false, pose = null, stepAcc = 0, footSide = 1;
  try { child = localStorage.getItem('kh-child') === '1'; } catch (e) {}
  const eyeStand = () => child ? 1.20 : 1.62, eyeCrouch = () => child ? 0.55 : 0.72, seatEye = () => child ? 0.56 : 0.74;
  const FLOOR = { carpet: 'carpet', rug: 'carpet', bathFloor: 'tile', bTile: 'tile', ubFloor: 'tile', floorGF: 'tile', balconyTile: 'tile', zellige: 'tile', deck: 'wood', woodLight: 'wood', oak: 'wood', concrete: 'stone', pavers: 'stone' };
  function groundKind() {
    for (const w of near(wgrid, P.x, P.y)) if (Math.abs(w.z - P.z) < 0.03 && inPatch(w, P.x, P.y)) return FLOOR[w.mat] || 'stone';
    if (inRamp(P.x, P.y) || P.x < -11.3) return 'stone';
    return 'grass';
  }
  const acts = [], seenLink = new Set();
  for (const d of doors) {
    if (!d.mover) { acts.push({ type: 'door', d, reach: 1.8, cone: 1.37, pad: 0 }); continue; }
    if (d.link) { if (seenLink.has(d.link)) continue; seenLink.add(d.link); }
    acts.push({ type: 'part', d, c: d.center, reach: d.reach, cone: d.cone, pad: 0.12 });
  }
  for (const st of B.seats) acts.push({ type: st.kind, s: st, c: st.kind === 'lie' ? [st.x + st.face[0] * 0.75, st.y + st.face[1] * 0.75, st.seatZ] : [st.x, st.y, st.kind === 'bunk' ? st.seatZ - 0.4 : st.seatZ],
    reach: st.kind === 'lie' ? 1.8 : st.kind === 'bunk' ? 1.3 : 1.5, cone: st.kind === 'lie' ? 0.75 : 0.65, pad: 0.12 });
  function closedCenter(d) { return [d.hinge[0] + d.closed[0] * d.w / 2, d.hinge[1] + d.closed[1] * d.w / 2, d.z0 + 1.0]; }
  function actCenter(a) { return a.type === 'door' ? (a.d.garage ? (P.x < 1.8 ? [1.75, 15.2, -1.6] : [1.95, 15.2, -1.6]) : closedCenter(a.d)) : a.c; }
  function actLabel(a) {
    if (a.type === 'door') return (a.d.target ? 'Close ' : 'Open ') + a.d.label.charAt(0).toLowerCase() + a.d.label.slice(1);
    if (a.type === 'part') return a.d.verbs[a.d.target ? 1 : 0] + ' ' + a.d.label;
    if (a.type === 'sit') return 'Sit on the ' + a.s.label;
    if (a.type === 'lie') return 'Lie down on the bed';
    return 'Climb up to the top bunk';
  }
  // nothing solid between the eye and the thing (stops a little short of it)
  function clearPath(e, c, pad) {
    const dx = c[0] - e[0], dy = c[1] - e[1], dz = c[2] - e[2], L = Math.hypot(dx, dy, dz);
    for (let q = 0.1; q < L - pad; q += 0.05) {
      const t = q / L, x = e[0] + dx * t, y = e[1] + dy * t, z = e[2] + dz * t;
      for (const b of near(grid, x, y)) {
        if (b.tag === 'glass' || (c[0] > b.x0 - 0.05 && c[0] < b.x1 + 0.05 && c[1] > b.y0 - 0.05 && c[1] < b.y1 + 0.05)) continue; // the thing's own body
        if (x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1 && z > b.z0 && z < b.z1) return false;
      }
    }
    return true;
  }
  function pickAct() {
    const cp = Math.cos(P.pitch), f = [Math.cos(P.yaw) * cp, Math.sin(P.yaw) * cp, Math.sin(P.pitch)], fx = Math.cos(P.yaw), fy = Math.sin(P.yaw);
    const e = [P.x, P.y, P.z + P.eye];
    let best = null, bs = 1e9;
    for (const a of acts) {
      const c = actCenter(a);
      if (Math.abs(c[2] - (P.z + 1.0)) > 1.7) continue;
      const dx = c[0] - e[0], dy = c[1] - e[1], dz = c[2] - e[2], hd = Math.hypot(dx, dy);
      if (hd > a.reach) continue;
      const ang = a.type === 'door' ? Math.acos(Math.max(-1, Math.min(1, (dx * fx + dy * fy) / (hd + 1e-6))))
        : Math.acos(Math.max(-1, Math.min(1, (dx * f[0] + dy * f[1] + dz * f[2]) / (Math.hypot(dx, dy, dz) + 1e-6))));
      if (ang > a.cone) continue;
      const sc = ang + hd * 0.1 + (a.type === 'door' ? 0.3 : 0);
      if (sc >= bs || (a.type !== 'door' && !clearPath(e, c, a.pad))) continue;
      bs = sc; best = a;
    }
    return best;
  }
  function toggleDoor(d) {
    if (!d) return;
    if (d.target === 1 && d.box) { // closing: ensure the player is not inside the leaf box
      const b = d.box; const cx = Math.max(b.x0, Math.min(P.x, b.x1)), cy = Math.max(b.y0, Math.min(P.y, b.y1));
      if (Math.hypot(P.x - cx, P.y - cy) < P.r + 0.05 && P.z < b.z1 && P.z + 1.7 > b.z0) return;
    }
    const nt = d.target ? 0 : 1;
    if (d.link) { for (const o of doors) if (o.link === d.link) o.target = nt; } else d.target = nt;
    if (d.scaleY) SND.burst(0.07, 2400, 1200, 0.45, 'bandpass', 0.08, 0, 0.5);
    else if (d.slide && d.mover) SND.burst(0.08, 600, 300, 0.28, 'lowpass', 0.03);
    else SND.burst(0.06, 2600, 1800, 0.04, 'highpass', 0.002);
  }
  // ---- sitting, lying down, climbing onto the top bunk ----
  const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const lerpAng = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
  function fillLook(fr) { for (let i = 1; i < fr.length; i++) { if (fr[i].yaw == null) fr[i].yaw = fr[i - 1].yaw; if (fr[i].pitch == null) fr[i].pitch = fr[i - 1].pitch; } return fr; }
  function startPose(kind, frames, dur) {
    const e0 = { p: [P.x, P.y, P.z + P.eye], yaw: P.yaw, pitch: P.pitch };
    crouch = false; blaster.trigger(false);
    pose = { kind, frames: fillLook([e0].concat(frames)), dur, t: 0, dir: 1, eye: e0.p.slice() };
    SND.burst(0.05, 500, 250, 0.2, 'lowpass', 0.03);
  }
  function leavePose() {
    if (!pose || pose.t < 1 || pose.dir !== 1) return;
    const fr = pose.frames.slice().reverse().map(f => ({ p: f.p, yaw: null, pitch: null }));
    fr[0] = { p: pose.eye.slice(), yaw: P.yaw, pitch: P.pitch };
    fr[fr.length - 1] = { p: [P.x, P.y, P.z + P.eye], yaw: null, pitch: 0 };
    pose = { kind: pose.kind, frames: fillLook(fr), dur: pose.dur * 0.8, t: 0, dir: -1, eye: fr[0].p.slice() };
  }
  function updatePose(dt) {
    if (!pose || pose.t >= 1) return;
    pose.t = Math.min(1, pose.t + dt / pose.dur);
    const n = pose.frames.length - 1, u = ease(pose.t) * n, i = Math.min(n - 1, Math.floor(u)), k = u - i, a = pose.frames[i], b = pose.frames[i + 1];
    const kk = ease(k);
    pose.eye = [0, 1, 2].map(j => a.p[j] + (b.p[j] - a.p[j]) * k);
    P.yaw = lerpAng(a.yaw, b.yaw, kk); P.pitch = a.pitch + (b.pitch - a.pitch) * kk;
    if (pose.t >= 1 && pose.dir === -1) pose = null;
  }
  function doAct(a) {
    if (!a) return;
    if (a.type === 'door' || a.type === 'part') { toggleDoor(a.d); return; }
    const st = a.s, fx = st.face ? st.face[0] : 0, fy = st.face ? st.face[1] : 0, yaw = Math.atan2(fy, fx);
    if (a.type === 'sit') startPose('sit', [{ p: [st.x - fx * 0.06, st.y - fy * 0.06, st.seatZ + seatEye()], yaw, pitch: -0.08 }], 0.7);
    else if (a.type === 'lie') startPose('lie', [
      { p: [st.x + fx * 0.45, st.y + fy * 0.45, st.seatZ + 0.8], yaw, pitch: -0.35 },
      { p: [st.x, st.y, st.seatZ + 0.17], yaw, pitch: 1.32 }], 1.1);
    else startPose('bunk', [
      { p: [st.x + 0.24, st.y, st.seatZ + 0.25], yaw: Math.PI, pitch: 0.3 },
      { p: [st.x + 0.10, st.y, st.seatZ + 0.62], yaw: Math.PI, pitch: -0.15 },
      { p: [st.x - 0.35, st.y - 0.1, st.seatZ + 0.45], yaw: Math.PI, pitch: -0.2 },
      { p: st.lie.slice(), yaw: Math.PI, pitch: 1.25 }], 2.6);
  }
  function useKey() {
    if (mode !== 'walk') return;
    if (pose) { leavePose(); return; }
    doAct(pickAct());
  }
  let hint = null;

  // ---- minimap ----
  const mapC = $('map'), mctx = mapC.getContext('2d');
  const base = document.createElement('canvas');
  let mapLevel = 'O';
  const MAPV = { B: { x0: 0.5, x1: 11.5, y0: 11.3, y1: 22.3, z: -1.5 }, G: { x0: -0.3, x1: 11.9, y0: 11.3, y1: 22.3, z: 1.0 }, U: { x0: 0.5, x1: 11.5, y0: 11.3, y1: 22.3, z: 3.9 }, O: { x0: -13, x1: 27, y0: -1.5, y1: 25.5, z: 1.0 } };
  function drawMapBase() {
    const S = 200 * (window.devicePixelRatio > 1 ? 2 : 1); base.width = base.height = S; mapC.width = mapC.height = S;
    const v = MAPV[mapLevel], sc = S / Math.max(v.x1 - v.x0, v.y1 - v.y0), ctx = base.getContext('2d');
    const X = (x) => (x - v.x0) * sc, Y = (y) => (y - v.y0) * sc;
    ctx.fillStyle = '#20252a'; ctx.fillRect(0, 0, S, S);
    // floors of this level
    const fz = mapLevel === 'B' ? LV.B : mapLevel === 'U' ? LV.U : 0;
    ctx.fillStyle = mapLevel === 'O' ? '#3b4a33' : '#2d3439';
    if (mapLevel === 'O') { ctx.fillRect(X(-11.3), Y(-0.32), (37.3) * sc, 24.62 * sc); ctx.fillStyle = '#4a4d50'; ctx.fillRect(X(-21), 0, 8.4 * sc, S); }
    ctx.fillStyle = '#e8e4da';
    for (const w of walks) if (Math.abs(w.z - fz) < (mapLevel === 'O' ? 0.8 : 0.3) && w.x1 - w.x0 < 20) ctx.fillRect(X(w.x0), Y(w.y0), (w.x1 - w.x0) * sc + 0.5, (w.y1 - w.y0) * sc + 0.5);
    if (mapLevel === 'O') { ctx.fillStyle = '#6d7479'; for (const [a, b, c, d] of [[1.6, 8.86, 11.99, 17.81], [2.67, 8.545, 17.81, 20.34], [4.03, 8.545, 20.34, 21.34], [8.48, 10.53, 17.68, 20.34]]) {
      ctx.fillRect(X(a), Y(c), (b - a) * sc, (d - c) * sc); ctx.fillRect(X(a), Y(MIRROR_Y - d), (b - a) * sc, (d - c) * sc); } }
    ctx.fillStyle = '#12161a';
    for (const c of colliders) if (c.tag !== 'glass' && c.z0 <= v.z && c.z1 >= v.z && (c.x1 - c.x0) * (c.y1 - c.y0) < 40 && (mapLevel !== 'O' || c.z1 - c.z0 > 1.5)) ctx.fillRect(X(c.x0), Y(c.y0), Math.max(1, (c.x1 - c.x0) * sc), Math.max(1, (c.y1 - c.y0) * sc));
    // labels
    ctx.fillStyle = 'rgba(40,46,52,0.85)'; ctx.font = `${Math.round(S / 28)}px "Barlow Semi Condensed", "Arial Narrow", sans-serif`; ctx.textAlign = 'center';
    for (const r of ROOMS) if (r[1] === mapLevel && (r[3] - r[2]) > 1.4) { ctx.fillText(r[0].replace(' and utility', ''), X((r[2] + r[3]) / 2), Y((r[4] + r[5]) / 2) + 4); }
    mapC.dataset.sc = sc;
  }
  function drawMap() {
    const S = mapC.width, v = MAPV[mapLevel], sc = S / Math.max(v.x1 - v.x0, v.y1 - v.y0);
    mctx.drawImage(base, 0, 0);
    const x = (P.x - v.x0) * sc, y = (P.y - v.y0) * sc, a = mode === 'overview' ? O.az + Math.PI : P.yaw;
    mctx.save(); mctx.translate(x, y); mctx.rotate(a);
    mctx.fillStyle = 'rgba(80,120,255,0.28)'; mctx.beginPath(); mctx.moveTo(0, 0); mctx.arc(0, 0, S * 0.12, -0.55, 0.55); mctx.closePath(); mctx.fill();
    mctx.fillStyle = '#5b82ff'; mctx.strokeStyle = '#fff'; mctx.lineWidth = S / 120; mctx.beginPath(); mctx.arc(0, 0, S / 40, 0, 7); mctx.fill(); mctx.stroke();
    mctx.restore();
  }
  mapC.addEventListener('click', (e) => {
    if (mode !== 'walk') return;
    const r = mapC.getBoundingClientRect(), v = MAPV[mapLevel], span = Math.max(v.x1 - v.x0, v.y1 - v.y0);
    const x = v.x0 + (e.clientX - r.left) / r.width * span, y = v.y0 + (e.clientY - r.top) / r.height * span;
    const zRef = mapLevel === 'B' ? LV.B + 0.3 : mapLevel === 'U' ? LV.U + 0.3 : (mapLevel === 'G' ? 0.3 : 0.3);
    const f = floorAt(x, y, zRef);
    if (isFinite(f) && f > zRef - 1.2 && !hitWall(x, y, f + 0.32, f + 1.72).some(c => x > c.x0 - 0.2 && x < c.x1 + 0.2 && y > c.y0 - 0.2 && y < c.y1 + 0.2)) { P.x = x; P.y = y; P.z = f; P.vz = 0; P.vx = P.vy = 0; pose = null; }
  });

  // ---- foam-dart blaster (optional, walk mode only) ----
  function boxesNear(x, y) {
    const out = near(grid, x, y).slice();
    for (const d of doors) {
      if (!d.box) continue;
      if (d.garage || d.slide) { if (d.t < 0.05) out.push(d.box); continue; }
      if (d.t < 0.05) out.push(d.box);
      else if (d.t > 0.95 && d.open) { // open leaf lies along the open direction
        const [hx, hy] = d.hinge, [ox, oy] = d.open, t = 0.02, ex = hx + ox * d.w, ey = hy + oy * d.w;
        out.push({ x0: Math.min(hx, ex) - (ox === 0 ? t : 0), x1: Math.max(hx, ex) + (ox === 0 ? t : 0), y0: Math.min(hy, ey) - (oy === 0 ? t : 0), y1: Math.max(hy, ey) + (oy === 0 ? t : 0), z0: d.box.z0, z1: d.box.z1 });
      }
    }
    return out;
  }
  const blaster = makeBlaster({ E, mats, P, floorAt, surfaces, boxesNear, outdoorAt: (x, y, z) => whereAt(x, y, z).lv === 'O' });
  const ammoEl = $('ammoN'), ammoBox = $('ammo');
  const spareEl = $('ammoSpare');
  blaster.S.onAmmo = (n, max, reloading, spare) => { ammoEl.textContent = reloading ? '…' : String(n); spareEl.textContent = spare + ' spare'; ammoBox.classList.toggle('low', !reloading && n <= 3); };
  blaster.S.onEmpty = (why) => showToast(why === 'reload' ? 'Magazine empty. Press R to reload' : 'No darts left. Walk over the darts on the floor to pick them up');
  blaster.S.onPick = (n) => { ammoBox.classList.remove('pick'); void ammoBox.offsetWidth; ammoBox.classList.add('pick'); };
  function setBlaster(on, quiet) {
    blaster.setEnabled(on);
    $('gunBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
    document.body.dataset.gun = on ? 'on' : 'off';
    try { localStorage.setItem('kh-blaster', on ? '1' : '0'); } catch (e) {}
    if (!quiet && on) showToast(mode === 'walk' ? 'Blaster on: F to fire, R to reload, G to put it away' : 'The blaster appears when you walk');
  }

  // ---- input ----
  let locked = false, dragging = false, lastX = 0, lastY = 0;
  const touchMove = { f: 0, s: 0 };
  document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; $('lockHint').hidden = locked || mode !== 'walk'; });
  canvas.addEventListener('click', () => { if (mode === 'walk' && !locked && matchMedia('(pointer: fine)').matches) { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {} } });
  // the mouse only looks: captured, moving it looks; free, a left-button drag looks. The blaster fires with F.
  document.addEventListener('pointerlockerror', () => { $('lockHint').textContent = 'Drag the view to look around'; });
  canvas.addEventListener('contextmenu', (e) => { if (mode === 'walk') e.preventDefault(); }); // a stray right-click shouldn't release the mouse
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true; lastX = e.clientX; lastY = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (err) {} if (e.pointerType === 'touch' && mode === 'walk') touchStart(e); });
  canvas.addEventListener('pointerup', (e) => { dragging = false; touchMove.f = 0; touchMove.s = 0; });
  canvas.addEventListener('pointermove', (e) => {
    if (locked) { look(e.movementX, e.movementY); return; }
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
    if (mode === 'overview') { O.az -= dx * 0.006; O.el = Math.max(0.08, Math.min(1.45, O.el + dy * 0.005)); }
    else if (e.pointerType === 'touch' && touchSide === 'move') { touchMove.f = Math.max(-1, Math.min(1, -(e.clientY - touchY0) / 60)); touchMove.s = Math.max(-1, Math.min(1, (e.clientX - touchX0) / 60)); }
    else look(-dx * 1.4, -dy * 1.4);
  });
  let touchSide = 'look', touchX0 = 0, touchY0 = 0;
  function touchStart(e) { touchSide = e.clientX < window.innerWidth * 0.4 ? 'move' : 'look'; touchX0 = e.clientX; touchY0 = e.clientY; }
  function look(dx, dy) { P.yaw += dx * 0.0022; P.pitch = Math.max(-1.45, Math.min(1.45, P.pitch - dy * 0.0022)); }
  canvas.addEventListener('wheel', (e) => { if (mode === 'overview') { O.dist = Math.max(8, Math.min(70, O.dist * (1 + Math.sign(e.deltaY) * 0.1))); e.preventDefault(); } }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
    keys.add(e.code);
    if (mode === 'walk' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.code === 'KeyE' && !e.repeat) useKey();
    if (e.code === 'KeyC' && !e.repeat && mode === 'walk' && !pose) { crouch = !crouch; showToast(crouch ? 'Crouching. Press C to stand up' : 'Standing'); }
    if (e.code === 'KeyG' && !e.repeat) setBlaster(!blaster.enabled);
    if (e.code === 'KeyV' && !e.repeat) setWide(!wideView, true);
    if (e.code === 'KeyR' && blaster.active) blaster.reload();
    if (e.code === 'KeyF' && !e.repeat && mode === 'walk' && blaster.active) blaster.trigger(true);
    if (e.code === 'KeyM') { $('mapWrap').hidden = !$('mapWrap').hidden; }
    if (e.code === 'KeyO') setMode(mode === 'overview' ? 'walk' : 'overview');
    if (e.code === 'KeyH') $('help').hidden = !$('help').hidden;
  });
  window.addEventListener('keyup', (e) => { keys.delete(e.code); if (e.code === 'KeyF') blaster.trigger(false); });
  window.addEventListener('blur', () => { keys.clear(); blaster.trigger(false); });

  // ---- UI wiring ----
  function setMode(m) {
    mode = m;
    $('intro').hidden = true; $('hud').hidden = false;
    document.body.dataset.mode = m;
    $('cutbar').hidden = m !== 'overview';
    $('modeBtn').textContent = m === 'overview' ? 'Walk' : 'Overview';
    $('lockHint').hidden = locked || m !== 'walk';
    if (m === 'overview' && document.pointerLockElement) document.exitPointerLock();
    applyCut();
  }
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { teleport(b.dataset.go); }));
  document.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => setQuality(b.dataset.q)));
  document.querySelectorAll('[data-cut]').forEach(b => b.addEventListener('click', () => { O.cut = b.dataset.cut; document.querySelectorAll('[data-cut]').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); applyCut(); }));
  $('startBtn').addEventListener('click', () => { teleport('street'); try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {} });
  $('overBtn').addEventListener('click', () => setMode('overview'));
  $('modeBtn').addEventListener('click', () => setMode(mode === 'overview' ? 'walk' : 'overview'));
  $('helpBtn').addEventListener('click', () => { $('help').hidden = !$('help').hidden; });
  $('helpClose').addEventListener('click', () => { $('help').hidden = true; });
  $('mapBtn').addEventListener('click', () => { $('mapWrap').hidden = !$('mapWrap').hidden; });
  $('doorHint').addEventListener('click', () => useKey());
  const setChild = (on) => { child = on; $('childBtn').setAttribute('aria-pressed', on ? 'true' : 'false'); try { localStorage.setItem('kh-child', on ? '1' : '0'); } catch (e) {} };
  $('childBtn').addEventListener('click', () => { setChild(!child); showToast(child ? "Child's eye height: 1.20 m" : 'Adult eye height: 1.62 m'); });
  setChild(child);
  const setSound = (on) => { SND.muted = !on; $('soundBtn').setAttribute('aria-pressed', on ? 'true' : 'false'); };
  $('soundBtn').addEventListener('click', () => setSound(SND.muted));
  setSound(!SND.muted);
  // browsers only allow sound after a click or key press: wake the audio up on the first one
  for (const ev of ['keydown', 'pointerdown']) window.addEventListener(ev, () => SND.ctx(), { once: true });
  $('gunBtn').addEventListener('click', () => setBlaster(!blaster.enabled));
  function setWide(on, say) {
    wideView = on; $('wideBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
    try { localStorage.setItem('kh-wide', on ? '1' : '0'); } catch (e) {}
    if (say) showToast(on ? 'Wide view (about 100° across)' : 'Natural view (about 80° across)');
  }
  $('wideBtn').addEventListener('click', () => setWide(!wideView, true));
  setWide(wideView);
  const fireBtn = $('fireBtn');
  fireBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); blaster.trigger(true); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) fireBtn.addEventListener(ev, () => blaster.trigger(false));
  $('reloadBtn').addEventListener('click', (e) => { e.stopPropagation(); blaster.reload(); });
  let bl = false; try { bl = localStorage.getItem('kh-blaster') === '1'; } catch (e) {}
  setBlaster(bl, true);
  const bright = $('bright'); bright.value = env.exposure;
  bright.addEventListener('input', () => { env.exposure = parseFloat(bright.value); try { localStorage.setItem('kh-bright', String(env.exposure)); } catch (e) {} });
  bright.addEventListener('keydown', (e) => e.stopPropagation());

  // ---- loop ----
  let last = performance.now(), fpsAcc = 0, fpsN = 0, slowFor = 0, autoStepped = false;
  const fpsEl = $('fps');
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (mode === 'walk') { if (!window.__freeze) { move(dt); updatePose(dt); } updateHud(); }
    else if (mode === 'intro') { O.az += dt * 0.05; }
    else { updateHud(); }
    for (const d of doors) if (d.t !== d.target) { d.t = d.target > d.t ? Math.min(1, d.t + dt * 2.6) : Math.max(0, d.t - dt * 2.6); setDoorMatrix(d); }
    if (mode === 'walk') {
      const a = pose ? (pose.t >= 1 && pose.dir === 1 ? 'pose' : null) : pickAct();
      if (a !== hint) { hint = a; $('doorHint').hidden = !a; }
      if (a) $('doorHintText').textContent = a === 'pose' ? (pose.kind === 'bunk' ? 'Climb down' : 'Stand up') : actLabel(a);
    } else if (hint) { hint = null; $('doorHint').hidden = true; }
    resize(); updateCam();
    blaster.update(dt, mode === 'walk' && !pose, mode === 'walk' && whereAmI().lv === 'O');
    E.render(cam, env);
    if (!$('mapWrap').hidden && mode !== 'intro') drawMap();
    // fps + auto quality
    fpsAcc += dt; fpsN++;
    if (fpsAcc > 1) {
      const fps = fpsN / fpsAcc; fpsEl.textContent = Math.round(fps) + ' fps';
      if (mode !== 'intro' && fps < 28 && !autoStepped) { slowFor++; if (slowFor >= 3) { autoStepped = true; if (quality === 'sharp') setQuality('balanced'); else if (quality === 'balanced') setQuality('smooth'); showToast('Switched to ' + QUAL[quality].label + ' quality for smoother movement'); } } else slowFor = 0;
      fpsAcc = 0; fpsN = 0;
    }
    requestAnimationFrame(frame);
  }
  function showToast(t) { const el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(showToast.h); showToast.h = setTimeout(() => el.hidden = true, 4000); }
  // intro view: overview orbit behind the intro card
  mode = 'intro'; O.cut = 'all'; applyCut();
  setQuality(quality);
  $('boot').hidden = true; $('intro').hidden = false;
  requestAnimationFrame(frame);
  // test hooks
  const sim = (steps, dt, codes) => { keys.clear(); for (const c of codes) keys.add(c); for (let i = 0; i < steps; i++) move(dt); keys.clear(); return { x: P.x, y: P.y, z: P.z }; };
  window.__app = { groundKind, tick: (dt) => { updatePose(dt); for (const d of doors) if (d.t !== d.target) { d.t = d.target > d.t ? Math.min(1, d.t + dt * 2.6) : Math.max(0, d.t - dt * 2.6); setDoorMatrix(d); } }, pickAct, doAct, useKey, acts, get pose() { return pose; }, setCrouch: (c) => { crouch = c; }, setChild, boxesNear, blaster, setBlaster, sim, P, O, teleport, setMode, setQuality, doors, toggleDoor, floorAt, E, groups, applyCut, whereAmI, render: () => { resize(); updateCam(); E.render(cam, env); }, get mode() { return mode; } };
}, 40);
