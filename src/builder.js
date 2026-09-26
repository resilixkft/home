// ---------- Geometry builder: plan coords (x, y, z=height) -> GL (X=x, Y=z, Z=y) ----------
const MIRROR_Y = 23.976; // party wall axis * 2
function lin(h) { if (Array.isArray(h)) return h; const c = hex(h); return c.map(v => Math.pow(v / 255, 2.2)); }

// rotation (for M4.rotY about the hinge) that turns a leaf lying along 'closed' to lie along 'open' (plan unit vectors)
function hingeAng(closed, open, k = 1) { let th = Math.atan2(closed[1], closed[0]) - Math.atan2(open[1], open[0]); while (th > Math.PI) th -= 2 * Math.PI; while (th < -Math.PI) th += 2 * Math.PI; return th * k; }

class Builder {
  constructor() {
    this.buckets = new Map(); this.group = 'ground'; this.mirror = false;
    this.col = [1, 1, 1]; this.extF = 0; this.fz = 0; this.cz = 0;
    this.colliders = []; this.walk = []; this.rooms = []; this.doorDefs = []; this.lights = []; this.seats = [];
    this.collide = true;
  }
  _b(mat) {
    const grp = this.forceGroup || this.group;
    const key = grp + '|' + mat;
    let b = this.buckets.get(key);
    if (!b) { b = { group: grp, mat, pos: [], nrm: [], uv: [], col: [], ext: [], idx: [] }; this.buckets.set(key, b); }
    return b;
  }
  // push a planar polygon (GL coords, convex, ordered around) with intended normal n (GL)
  polyGL(mat, pts, n, o = {}) {
    if (!mat) return;
    let P = pts.map(p => p.slice()), N = n.slice(), UV = o.uvs ? o.uvs.slice() : null;
    if (this.mirror) { P = P.map(p => [p[0], p[1], MIRROR_Y - p[2]]); N = [N[0], N[1], -N[2]]; }
    // winding check (use the largest cross product among fan triangles for robustness)
    let best = 0;
    for (let i = 1; i < P.length - 1; i++) {
      const a = P[0], b = P[i], c = P[i + 1];
      const cx = (b[1]-a[1])*(c[2]-a[2]) - (b[2]-a[2])*(c[1]-a[1]);
      const cy = (b[2]-a[2])*(c[0]-a[0]) - (b[0]-a[0])*(c[2]-a[2]);
      const cz = (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
      const d = cx*N[0] + cy*N[1] + cz*N[2];
      if (Math.abs(d) > Math.abs(best)) best = d;
    }
    if (best < 0) { P.reverse(); if (UV) UV.reverse(); }
    const B = this._b(mat), base = B.pos.length / 3;
    // tangent frame for world UVs
    let t;
    if (Math.abs(N[1]) > 0.999) t = [1, 0, 0];
    else { t = [N[2], 0, -N[0]]; const l = Math.hypot(t[0], t[2]); t = [t[0]/l, 0, t[2]/l]; }
    const bt = [N[1]*t[2] - N[2]*t[1], N[2]*t[0] - N[0]*t[2], N[0]*t[1] - N[1]*t[0]];
    const col = o.col ? lin(o.col) : this.col;
    const ext = [o.ext !== undefined ? o.ext : this.extF, o.fz !== undefined ? o.fz : this.fz, o.cz !== undefined ? o.cz : this.cz];
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      B.pos.push(p[0], p[1], p[2]); B.nrm.push(N[0], N[1], N[2]);
      if (UV) B.uv.push(UV[i][0], UV[i][1]);
      else B.uv.push(p[0]*t[0] + p[1]*t[1] + p[2]*t[2] + (o.uo || 0), -(p[0]*bt[0] + p[1]*bt[1] + p[2]*bt[2]) + (o.vo || 0));
      B.col.push(col[0], col[1], col[2]); B.ext.push(ext[0], ext[1], ext[2]);
    }
    for (let i = 1; i < P.length - 1; i++) B.idx.push(base, base + i, base + i + 1);
  }
  // plan-coord polygon
  poly(mat, pts, n, o) { this.polyGL(mat, pts.map(p => [p[0], p[2], p[1]]), [n[0], n[2], n[1]], o); }
  addCollider(x0, x1, y0, y1, z0, z1, tag) {
    if (!this.collide) return;
    if (this.mirror) { const a = MIRROR_Y - y1, b = MIRROR_Y - y0; y0 = a; y1 = b; }
    this.colliders.push({ x0, x1, y0, y1, z0, z1, tag });
  }
  // axis aligned box in plan coords. o.mat default material, o.f face overrides {xn,xp,yn,yp,zn,zp}; null skips
  box(x0, x1, y0, y1, z0, z1, o = {}) {
    if (x1 - x0 < 1e-4 || y1 - y0 < 1e-4 || z1 - z0 < 1e-4) return;
    const f = o.f || {}, m = (k) => (k in f ? f[k] : o.mat);
    const fo = (k) => { const r = { col: o.col, ext: o.ext, fz: o.fz, cz: o.cz }; if (o.fe && k in o.fe) r.ext = o.fe[k]; if (o.uvf && o.uvf[k]) r.uvs = o.uvf[k]; return r; };
    this.poly(m('xn'), [[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]], [-1,0,0], fo('xn'));
    this.poly(m('xp'), [[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]], [1,0,0], fo('xp'));
    this.poly(m('yn'), [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]], [0,-1,0], fo('yn'));
    this.poly(m('yp'), [[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]], [0,1,0], fo('yp'));
    this.poly(m('zn'), [[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]], [0,0,-1], fo('zn'));
    this.poly(m('zp'), [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]], [0,0,1], fo('zp'));
    if (o.collide) this.addCollider(x0, x1, y0, y1, z0, z1, o.tag);
  }
  // box rotated by yaw (radians, around vertical) centred at cx,cy; w along local x, d along local y
  boxR(cx, cy, z0, w, d, h, yaw, o = {}) {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    const L = (lx, ly, z) => [cx + lx * c - ly * s, cy + lx * s + ly * c, z];
    const hw = w / 2, hd = d / 2, z1 = z0 + h;
    const f = o.f || {}, m = (k) => (k in f ? f[k] : o.mat);
    const oo = { col: o.col, ext: o.ext, fz: o.fz, cz: o.cz };
    const R = (v) => [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
    this.poly(m('xn'), [L(-hw,-hd,z0),L(-hw,hd,z0),L(-hw,hd,z1),L(-hw,-hd,z1)], R([-1,0,0]), o.uvf && o.uvf.xn ? { ...oo, uvs: o.uvf.xn } : oo);
    this.poly(m('xp'), [L(hw,-hd,z0),L(hw,hd,z0),L(hw,hd,z1),L(hw,-hd,z1)], R([1,0,0]), o.uvf && o.uvf.xp ? { ...oo, uvs: o.uvf.xp } : oo);
    this.poly(m('yn'), [L(-hw,-hd,z0),L(hw,-hd,z0),L(hw,-hd,z1),L(-hw,-hd,z1)], R([0,-1,0]), o.uvf && o.uvf.yn ? { ...oo, uvs: o.uvf.yn } : oo);
    this.poly(m('yp'), [L(-hw,hd,z0),L(hw,hd,z0),L(hw,hd,z1),L(-hw,hd,z1)], R([0,1,0]), o.uvf && o.uvf.yp ? { ...oo, uvs: o.uvf.yp } : oo);
    this.poly(m('zn'), [L(-hw,-hd,z0),L(hw,-hd,z0),L(hw,hd,z0),L(-hw,hd,z0)], [0,0,-1], oo);
    this.poly(m('zp'), [L(-hw,-hd,z1),L(hw,-hd,z1),L(hw,hd,z1),L(-hw,hd,z1)], [0,0,1], oo);
    if (o.collide) {
      const xs = [L(-hw,-hd,0)[0], L(hw,-hd,0)[0], L(hw,hd,0)[0], L(-hw,hd,0)[0]], ys = [L(-hw,-hd,0)[1], L(hw,-hd,0)[1], L(hw,hd,0)[1], L(-hw,hd,0)[1]];
      this.addCollider(Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys), z0, z1, o.tag);
    }
  }
  cylZ(cx, cy, z0, z1, r, seg, o = {}) {
    const ry = o.ry || r;
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, am = (a0 + a1) / 2;
      const p0 = [cx + Math.cos(a0) * r, cy + Math.sin(a0) * ry], p1 = [cx + Math.cos(a1) * r, cy + Math.sin(a1) * ry];
      this.poly(o.mat, [[p0[0],p0[1],z0],[p1[0],p1[1],z0],[p1[0],p1[1],z1],[p0[0],p0[1],z1]], [Math.cos(am), Math.sin(am), 0], o);
    }
    if (o.caps !== false) {
      const top = [], bot = [];
      for (let i = 0; i < seg; i++) { const a = i / seg * Math.PI * 2; top.push([cx + Math.cos(a) * r, cy + Math.sin(a) * ry, z1]); bot.push([cx + Math.cos(a) * r, cy + Math.sin(a) * ry, z0]); }
      this.poly(o.capMat || o.mat, top, [0,0,1], o); if (o.bottom !== false) this.poly(o.capMat || o.mat, bot, [0,0,-1], o);
    }
    if (o.collide) this.addCollider(cx - r, cx + r, cy - ry, cy + ry, z0, z1, o.tag);
  }
  cone(cx, cy, z0, z1, r0, r1, seg, o = {}) {
    const k = (r0 - r1) / (z1 - z0);
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, am = (a0 + a1) / 2;
      const n = [Math.cos(am), Math.sin(am), k]; const l = Math.hypot(...n);
      this.poly(o.mat, [[cx + Math.cos(a0)*r0, cy + Math.sin(a0)*r0, z0],[cx + Math.cos(a1)*r0, cy + Math.sin(a1)*r0, z0],[cx + Math.cos(a1)*r1, cy + Math.sin(a1)*r1, z1],[cx + Math.cos(a0)*r1, cy + Math.sin(a0)*r1, z1]].filter((p, j) => !(r1 < 1e-4 && j === 3)),
        [n[0]/l, n[1]/l, n[2]/l], o);
    }
    if (r0 > 0 && o.bottom !== false) { const bot = []; for (let i = 0; i < seg; i++) { const a = i / seg * Math.PI * 2; bot.push([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, z0]); } this.poly(o.mat, bot, [0,0,-1], o); }
  }
  // cylinder between two plan points
  cylP(p0, p1, r, seg, o = {}) {
    const d = [p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2]], L = Math.hypot(...d); const u = d.map(v => v / L);
    let a = Math.abs(u[2]) < 0.9 ? [0,0,1] : [1,0,0];
    let v1 = [u[1]*a[2]-u[2]*a[1], u[2]*a[0]-u[0]*a[2], u[0]*a[1]-u[1]*a[0]]; const l1 = Math.hypot(...v1); v1 = v1.map(v => v / l1);
    const v2 = [u[1]*v1[2]-u[2]*v1[1], u[2]*v1[0]-u[0]*v1[2], u[0]*v1[1]-u[1]*v1[0]];
    const ring = (p, ang) => [p[0] + (Math.cos(ang)*v1[0] + Math.sin(ang)*v2[0]) * r, p[1] + (Math.cos(ang)*v1[1] + Math.sin(ang)*v2[1]) * r, p[2] + (Math.cos(ang)*v1[2] + Math.sin(ang)*v2[2]) * r];
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, am = (a0 + a1) / 2;
      const n = [Math.cos(am)*v1[0] + Math.sin(am)*v2[0], Math.cos(am)*v1[1] + Math.sin(am)*v2[1], Math.cos(am)*v1[2] + Math.sin(am)*v2[2]];
      this.poly(o.mat, [ring(p0, a0), ring(p0, a1), ring(p1, a1), ring(p1, a0)], n, o);
    }
    if (o.caps) { const A = [], Bq = []; for (let i = 0; i < seg; i++) { const g = i / seg * Math.PI * 2; A.push(ring(p0, g)); Bq.push(ring(p1, g)); }
      this.poly(o.mat, A, u.map(v => -v), o); this.poly(o.mat, Bq, u, o); }
  }
  // ellipsoid
  sph(cx, cy, cz, rx, ry, rz, seg, o = {}) {
    const rings = Math.max(3, seg >> 1);
    const P = (i, j) => { const th = i / rings * Math.PI, ph = j / seg * Math.PI * 2; return [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]; };
    for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
      const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
      const m = P(i + 0.5, j + 0.5);
      const pts = [a, b, c, d].map(q => [cx + q[0] * rx, cy + q[1] * ry, cz + q[2] * rz]);
      const n = [m[0] / rx, m[1] / ry, m[2] / rz]; const l = Math.hypot(...n);
      if (i === 0) this.poly(o.mat, [pts[0], pts[1], pts[2]], n.map(v => v / l), o);
      else if (i === rings - 1) this.poly(o.mat, [pts[0], pts[1], pts[3]], n.map(v => v / l), o);
      else this.poly(o.mat, pts, n.map(v => v / l), o);
    }
    if (o.collide) this.addCollider(cx - rx, cx + rx, cy - ry, cy + ry, cz - rz, cz + rz, o.tag);
  }
  // vertical prism: outline in (x,z) plane (convex, ordered), extruded along y from y0..y1
  prismY(outline, y0, y1, o = {}) {
    const f = o.f || {}, m = (k) => (k in f ? f[k] : o.mat);
    const fo = (k) => (o.fe && k in o.fe) ? Object.assign({}, o, { ext: o.fe[k] }) : o;
    this.poly(m('yn'), outline.map(p => [p[0], y0, p[1]]), [0,-1,0], fo('yn'));
    this.poly(m('yp'), outline.map(p => [p[0], y1, p[1]]), [0,1,0], fo('yp'));
    if (o.sides !== false) for (let i = 0; i < outline.length; i++) {
      const a = outline[i], b = outline[(i + 1) % outline.length];
      const ex = b[0] - a[0], ez = b[1] - a[1]; let n = [ez, 0, -ex]; const l = Math.hypot(n[0], n[2]); n = [n[0] / l, 0, n[2] / l];
      // outward check using centroid
      const cx = outline.reduce((s, p) => s + p[0], 0) / outline.length, cz = outline.reduce((s, p) => s + p[1], 0) / outline.length;
      if ((a[0] - cx) * n[0] + (a[1] - cz) * n[2] < 0) n = [-n[0], 0, -n[2]];
      this.poly(m('side'), [[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], n, fo('side'));
    }
  }
  prismX(outline, x0, x1, o = {}) { // outline in (y,z)
    const f = o.f || {}, m = (k) => (k in f ? f[k] : o.mat);
    this.poly(m('xn'), outline.map(p => [x0, p[0], p[1]]), [-1,0,0], o);
    this.poly(m('xp'), outline.map(p => [x1, p[0], p[1]]), [1,0,0], o);
    if (o.sides !== false) {
      const cy = outline.reduce((s, p) => s + p[0], 0) / outline.length, cz = outline.reduce((s, p) => s + p[1], 0) / outline.length;
      for (let i = 0; i < outline.length; i++) {
        const a = outline[i], b = outline[(i + 1) % outline.length];
        const ey = b[0] - a[0], ez = b[1] - a[1]; let n = [0, ez, -ey]; const l = Math.hypot(n[1], n[2]); n = [0, n[1] / l, n[2] / l];
        if ((a[0] - cy) * n[1] + (a[1] - cz) * n[2] < 0) n = [0, -n[1], -n[2]];
        this.poly(m('side'), [[x0, a[0], a[1]], [x0, b[0], b[1]], [x1, b[0], b[1]], [x1, a[0], a[1]]], n, o);
      }
    }
  }
  floor(x0, x1, y0, y1, z, mat, o = {}) {
    this.poly(mat, [[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]], [0,0,1], o);
    if (o.walk !== false) this.addWalk(x0, x1, y0, y1, z, mat);
  }
  // a part that moves as one piece (cabinet door, drawer, curtain, window sash). fn builds it into a child builder.
  // def: transform ({hinge, openAngle} | {slide:[dx,dy]} | {tilt:{axis,p,ang}} | {scaleY:{pivot,k}}) + label, verbs, center, reach, cone, link
  mover(def, fn) {
    if (this.mirror) return;
    const D = new Builder(); D.group = this.forceGroup || this.group; D.collide = false; D.extF = this.extF; D.fz = this.fz; D.cz = this.cz;
    fn(D);
    this.doorDefs.push(Object.assign({ id: 'mv' + this.doorDefs.length, group: this.forceGroup || this.group, builder: D, startOpen: false, mover: true, reach: 1.5, cone: 0.45, verbs: ['Open', 'Close'] }, def));
  }
  ceil(x0, x1, y0, y1, z, mat, o = {}) { this.poly(mat, [[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]], [0,0,-1], o); }
  addWalk(x0, x1, y0, y1, z, mat) {
    if (this.mirror) { const a = MIRROR_Y - y1, b = MIRROR_Y - y0; y0 = a; y1 = b; }
    this.walk.push({ x0, x1, y0, y1, z, mat });
  }
  addWalkPoly(pts, z, mat) { this.walk.push({ mat, poly: pts, z, x0: Math.min(...pts.map(p => p[0])), x1: Math.max(...pts.map(p => p[0])), y0: Math.min(...pts.map(p => p[1])), y1: Math.max(...pts.map(p => p[1])) }); }
  // Wall with openings. axis 'x': wall runs along plan y (thickness in x: t0..t1, length a..b).
  // axis 'y': wall runs along plan x (thickness in y: t0..t1, length a..b).
  // opts: open [{a,b,zb,zt}], ext side ('n'|'p') + extMat -> two layers, mat interior material, f face overrides
  wall(axis, t0, t1, a, b, z0, z1, opts = {}) {
    const layers = [];
    const skin = opts.skin || 0.12;
    if (opts.ext) {
      if (opts.ext === 'n') { layers.push({ t0, t1: t0 + skin, mat: opts.extMat, ext: 1 }); if (!opts.skinOnly) layers.push({ t0: t0 + skin, t1, mat: opts.mat || 'plaster', ext: 0 }); }
      else { if (!opts.skinOnly) layers.push({ t0, t1: t1 - skin, mat: opts.mat || 'plaster', ext: 0 }); layers.push({ t0: t1 - skin, t1, mat: opts.extMat, ext: 1 }); }
    } else layers.push({ t0, t1, mat: opts.mat || 'plaster', ext: opts.extFlag || 0 });
    const ops = (opts.open || []).map(o => ({ a: Math.max(a, o.a), b: Math.min(b, o.b), zb: Math.max(z0, o.zb), zt: Math.min(z1, o.zt) }))
      .filter(o => o.b > o.a && o.zt > o.zb).sort((p, q) => p.a - q.a);
    for (const L of layers) {
      const Z1 = (L.ext === 0 && opts.z1In) ? opts.z1In : z1;
      const put = (s0, s1, zz0, zz1) => {
        if (s1 - s0 < 1e-4 || zz1 - zz0 < 1e-4) return;
        const f = Object.assign({}, opts.f || {});
        const kA = axis === 'x' ? 'yn' : 'xn', kB = axis === 'x' ? 'yp' : 'xp';
        const fe = {};
        if (Math.abs(s0 - a) < 1e-6 && opts.endA !== undefined) { f[kA] = opts.endA; fe[kA] = opts.endA === 'plaster' ? 0 : 1; }
        if (Math.abs(s1 - b) < 1e-6 && opts.endB !== undefined) { f[kB] = opts.endB; fe[kB] = opts.endB === 'plaster' ? 0 : 1; }
        if (opts.topExt) fe.zp = 1;
        if (opts.noTop && Math.abs(zz1 - Z1) < 1e-6) f.zp = null;
        if (opts.botExt) fe.zn = 1;
        const o = { mat: L.mat, ext: L.ext, fz: L.ext ? 0 : (opts.fz ?? 0), cz: L.ext ? 0 : (opts.cz ?? 0), f, fe, collide: opts.collide !== false, col: opts.col };
        if (axis === 'x') this.box(L.t0, L.t1, s0, s1, zz0, zz1, o); else this.box(s0, s1, L.t0, L.t1, zz0, zz1, o);
      };
      let cur = a;
      for (const o of ops) {
        if (o.a > cur) put(cur, o.a, z0, Z1);
        put(o.a, o.b, z0, o.zb); put(o.a, o.b, o.zt, Z1);
        cur = Math.max(cur, o.b);
      }
      if (cur < b) put(cur, b, z0, Z1);
    }
  }
  finish(engine, mats) {
    const out = [];
    for (const b of this.buckets.values()) {
      if (!b.idx.length) continue;
      const mat = mats[b.mat]; if (!mat) { console.warn('missing material', b.mat); continue; }
      const mesh = engine.upload({ pos: new Float32Array(b.pos), nrm: new Float32Array(b.nrm), uv: new Float32Array(b.uv), col: new Float32Array(b.col), ext: new Float32Array(b.ext), idx: new Uint32Array(b.idx) });
      out.push({ mesh, mat, group: b.group, matName: b.mat, tris: b.idx.length / 3 });
    }
    return out;
  }
}
