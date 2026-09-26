// ---------- Minimal WebGL2 engine (column-major matrices, GL coords: X=plan x, Y=height, Z=plan y) ----------
const M4 = {
  create() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  mul(a, b, o = new Float32Array(16)) {
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  },
  persp(fovy, asp, n, f) {
    const t = 1 / Math.tan(fovy / 2), m = new Float32Array(16);
    m[0] = t / asp; m[5] = t; m[10] = (f + n) / (n - f); m[11] = -1; m[14] = 2 * f * n / (n - f); return m;
  },
  ortho(l, r, b, t, n, f) {
    const m = new Float32Array(16);
    m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n);
    m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n); m[15] = 1; return m;
  },
  lookAt(e, c, up) {
    let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
    let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    const m = new Float32Array(16);
    m[0] = xx; m[4] = xy; m[8] = xz; m[1] = yx; m[5] = yy; m[9] = yz; m[2] = zx; m[6] = zy; m[10] = zz;
    m[12] = -(xx * e[0] + xy * e[1] + xz * e[2]); m[13] = -(yx * e[0] + yy * e[1] + yz * e[2]);
    m[14] = -(zx * e[0] + zy * e[1] + zz * e[2]); m[15] = 1; return m;
  },
  invert(m) {
    const inv = new Float32Array(16);
    inv[0] = m[5]*m[10]*m[15]-m[5]*m[11]*m[14]-m[9]*m[6]*m[15]+m[9]*m[7]*m[14]+m[13]*m[6]*m[11]-m[13]*m[7]*m[10];
    inv[4] = -m[4]*m[10]*m[15]+m[4]*m[11]*m[14]+m[8]*m[6]*m[15]-m[8]*m[7]*m[14]-m[12]*m[6]*m[11]+m[12]*m[7]*m[10];
    inv[8] = m[4]*m[9]*m[15]-m[4]*m[11]*m[13]-m[8]*m[5]*m[15]+m[8]*m[7]*m[13]+m[12]*m[5]*m[11]-m[12]*m[7]*m[9];
    inv[12] = -m[4]*m[9]*m[14]+m[4]*m[10]*m[13]+m[8]*m[5]*m[14]-m[8]*m[6]*m[13]-m[12]*m[5]*m[10]+m[12]*m[6]*m[9];
    inv[1] = -m[1]*m[10]*m[15]+m[1]*m[11]*m[14]+m[9]*m[2]*m[15]-m[9]*m[3]*m[14]-m[13]*m[2]*m[11]+m[13]*m[3]*m[10];
    inv[5] = m[0]*m[10]*m[15]-m[0]*m[11]*m[14]-m[8]*m[2]*m[15]+m[8]*m[3]*m[14]+m[12]*m[2]*m[11]-m[12]*m[3]*m[10];
    inv[9] = -m[0]*m[9]*m[15]+m[0]*m[11]*m[13]+m[8]*m[1]*m[15]-m[8]*m[3]*m[13]-m[12]*m[1]*m[11]+m[12]*m[3]*m[9];
    inv[13] = m[0]*m[9]*m[14]-m[0]*m[10]*m[13]-m[8]*m[1]*m[14]+m[8]*m[2]*m[13]+m[12]*m[1]*m[10]-m[12]*m[2]*m[9];
    inv[2] = m[1]*m[6]*m[15]-m[1]*m[7]*m[14]-m[5]*m[2]*m[15]+m[5]*m[3]*m[14]+m[13]*m[2]*m[7]-m[13]*m[3]*m[6];
    inv[6] = -m[0]*m[6]*m[15]+m[0]*m[7]*m[14]+m[4]*m[2]*m[15]-m[4]*m[3]*m[14]-m[12]*m[2]*m[7]+m[12]*m[3]*m[6];
    inv[10] = m[0]*m[5]*m[15]-m[0]*m[7]*m[13]-m[4]*m[1]*m[15]+m[4]*m[3]*m[13]+m[12]*m[1]*m[7]-m[12]*m[3]*m[5];
    inv[14] = -m[0]*m[5]*m[14]+m[0]*m[6]*m[13]+m[4]*m[1]*m[14]-m[4]*m[2]*m[13]-m[12]*m[1]*m[6]+m[12]*m[2]*m[5];
    inv[3] = -m[1]*m[6]*m[11]+m[1]*m[7]*m[10]+m[5]*m[2]*m[11]-m[5]*m[3]*m[10]-m[9]*m[2]*m[7]+m[9]*m[3]*m[6];
    inv[7] = m[0]*m[6]*m[11]-m[0]*m[7]*m[10]-m[4]*m[2]*m[11]+m[4]*m[3]*m[10]+m[8]*m[2]*m[7]-m[8]*m[3]*m[6];
    inv[11] = -m[0]*m[5]*m[11]+m[0]*m[7]*m[9]+m[4]*m[1]*m[11]-m[4]*m[3]*m[9]-m[8]*m[1]*m[7]+m[8]*m[3]*m[5];
    inv[15] = m[0]*m[5]*m[10]-m[0]*m[6]*m[9]-m[4]*m[1]*m[10]+m[4]*m[2]*m[9]+m[8]*m[1]*m[6]-m[8]*m[2]*m[5];
    let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
    det = 1 / det; for (let i = 0; i < 16; i++) inv[i] *= det; return inv;
  },
  // rotation about GL Y axis (vertical) around pivot px,pz, then translate
  rotY(angle, px, py, pz) {
    const c = Math.cos(angle), s = Math.sin(angle), m = M4.create();
    m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
    m[12] = px - (c * px + s * pz); m[13] = 0; m[14] = pz - (-s * px + c * pz);
    return m;
  },
  // rotation about GL X axis around pivot (py, pz) in GL Y/Z
  rotX(angle, py, pz) {
    const c = Math.cos(angle), s = Math.sin(angle), m = M4.create();
    m[5] = c; m[6] = s; m[9] = -s; m[10] = c;
    m[13] = py - (c * py - s * pz); m[14] = pz - (s * py + c * pz);
    return m;
  },
  // rotation about GL Z axis around pivot (px,py)
  rotZ(angle, px, py) {
    const c = Math.cos(angle), s = Math.sin(angle), m = M4.create();
    m[0] = c; m[1] = s; m[4] = -s; m[5] = c;
    m[12] = px - (c * px - s * py); m[13] = py - (s * px + c * py);
    return m;
  }
};

const VS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm; layout(location=2) in vec2 aUv;
layout(location=3) in vec3 aCol; layout(location=4) in vec3 aExt;
uniform mat4 uVP, uModel, uSVP; uniform vec2 uUvScale;
out vec3 vW; out vec3 vN; out vec2 vUv; out vec3 vCol; out vec3 vExt; out vec4 vS;
void main(){ vec4 w = uModel*vec4(aPos,1.0); vW=w.xyz; vN=mat3(uModel)*aNrm; vUv=aUv*uUvScale; vCol=aCol; vExt=aExt;
  vS = uSVP*w; gl_Position = uVP*w; }`;

const FS = `#version 300 es
precision highp float; precision highp sampler2DShadow;
in vec3 vW; in vec3 vN; in vec2 vUv; in vec3 vCol; in vec3 vExt; in vec4 vS;
uniform sampler2D uTex; uniform sampler2DShadow uShadow;
uniform vec3 uSunDir, uSunCol, uSky, uGnd, uInTop, uInBot, uCam, uFog, uTint;
uniform float uFogD, uSpec, uShin, uAlpha, uEmis, uShTexel, uShadowOn, uRefl, uAlphaTest, uGlass, uExposure;
out vec4 frag;
vec3 skyCol(vec3 d){ float t = clamp(d.y*1.6,0.0,1.0); vec3 hz=vec3(0.80,0.85,0.90), zn=vec3(0.30,0.48,0.80);
  vec3 c = mix(hz, zn, pow(t,0.7)); if(d.y<0.0) c = mix(hz, vec3(0.38,0.40,0.34), clamp(-d.y*4.0,0.0,1.0)); return c; }
float shadowF(vec3 N){
  if(uShadowOn < 0.5) return 1.0;
  vec3 p = vS.xyz/vS.w*0.5+0.5;
  if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0||p.z>1.0) return 1.0;
  float nl = clamp(dot(N,uSunDir),0.0,1.0);
  float b = 0.0006 + 0.0018*(1.0-nl);
  float s = 0.0; vec2 o = vec2(uShTexel);
  s += texture(uShadow, vec3(p.xy+vec2(-0.6,-0.6)*o, p.z-b));
  s += texture(uShadow, vec3(p.xy+vec2( 0.6,-0.6)*o, p.z-b));
  s += texture(uShadow, vec3(p.xy+vec2(-0.6, 0.6)*o, p.z-b));
  s += texture(uShadow, vec3(p.xy+vec2( 0.6, 0.6)*o, p.z-b));
  return s*0.25;
}
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){
  vec4 t = texture(uTex, vUv);
  if(t.a < uAlphaTest) discard;
  bool outside = gl_FrontFacing;
  vec3 N = normalize(vN); if(!gl_FrontFacing) N = -N;
  vec3 alb = t.rgb * vCol * uTint;
  // soft highlight compression: whites stay white but stop glaring, darker colours barely change
  alb = alb / (1.0 + 0.30*alb);
  float ext = vExt.x;
  vec3 V = normalize(uCam - vW);
  float sh = shadowF(N);
  float nl = max(dot(N,uSunDir),0.0);
  vec3 amb;
  float up = N.y*0.5+0.5;
  float sunK = 1.0;
  if(ext > 0.5) amb = mix(uGnd, uSky, up);
  else {
    amb = mix(uInBot, uInTop, up);
    // light from the windows is directional: walls facing different ways get different shade,
    // so corners and edges between white surfaces stay readable
    vec2 dh = normalize(vec2(0.55, 0.83));
    float side = dot(N.xz, dh);
    amb *= 0.80 + 0.20*side + 0.06*abs(N.x);
    // contact shading near floor / ceiling on interior walls
    if(vExt.z > vExt.y + 0.5){
      float h = vW.y - vExt.y, c = vExt.z - vW.y;
      float vert = 1.0 - abs(N.y);
      float ao = 1.0 - vert*(0.34*(1.0-smoothstep(0.0,0.55,h)) + 0.30*(1.0-smoothstep(0.0,0.45,c)));
      amb *= ao;
    }
    sunK = 0.55;
  }
  vec3 col = alb * (uSunCol*nl*sh*sunK + amb) + alb*uEmis;
  vec3 H = normalize(uSunDir+V);
  float sp = pow(max(dot(N,H),0.0), uShin) * uSpec * sh * sunK;
  col += uSunCol * sp * 0.6;
  if(uRefl > 0.0){
    float fr = pow(1.0-max(dot(N,V),0.0), 4.0);
    vec3 R = reflect(-V,N);
    vec3 env = ext > 0.5 ? skyCol(R) : vec3(0.42,0.42,0.40);
    col = mix(col, env*1.05, clamp(uRefl*(0.08+0.92*fr),0.0,1.0));
  }
  float d = length(uCam - vW);
  float f = 1.0 - exp(-d*uFogD);
  col = mix(col, uFog, f*ext + f*0.10*(1.0-ext));
  col = aces(col*uExposure);
  col = pow(col, vec3(1.0/2.2));
  float a = t.a*uAlpha;
  if(uGlass > 0.5){
    float fr = pow(1.0-max(dot(N,V),0.0), 3.0);
    vec3 R = reflect(-V, N);
    vec3 env = skyCol(R);
    env = mix(env, vec3(0.20,0.26,0.18), clamp(-R.y*3.0+0.3, 0.0, 0.8));
    if(outside || uGlass > 1.5){
      vec3 g = mix(vec3(0.035,0.04,0.045), env, 0.30 + 0.6*fr);
      g = aces(g*1.05); g = pow(g, vec3(1.0/2.2));
      col = g; a = uGlass > 1.5 ? 0.97 : 0.62 + 0.35*fr;
    } else { a = 0.07 + 0.35*fr; }
  } else if(uRefl > 0.0) a = clamp(a + pow(1.0-max(dot(N,V),0.0),3.0)*0.5, 0.0, 1.0);
  frag = vec4(col, a);
}`;

const SVS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=2) in vec2 aUv; uniform mat4 uVP, uModel; uniform vec2 uUvScale; out vec2 vUv;
void main(){ vUv = aUv*uUvScale; gl_Position = uVP*uModel*vec4(aPos,1.0); }`;
const SFS = `#version 300 es
precision mediump float; in vec2 vUv; uniform sampler2D uTex; uniform float uAlphaTest; out vec4 o;
void main(){ if(uAlphaTest>0.0 && texture(uTex,vUv).a < uAlphaTest) discard; o = vec4(1.0); }`;

const SKYVS = `#version 300 es
layout(location=0) in vec2 aP; out vec2 vP; void main(){ vP=aP; gl_Position=vec4(aP,0.9999,1.0);} `;
const SKYFS = `#version 300 es
precision highp float; in vec2 vP; uniform mat4 uInvVP; uniform vec3 uSunDir; uniform float uExposure; out vec4 o;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){
  vec4 a = uInvVP*vec4(vP,-1.0,1.0); vec4 b = uInvVP*vec4(vP,1.0,1.0);
  vec3 d = normalize(b.xyz/b.w - a.xyz/a.w);
  float t = clamp(d.y*1.6,0.0,1.0);
  vec3 hz=vec3(0.80,0.85,0.90), zn=vec3(0.30,0.48,0.80);
  vec3 c = mix(hz, zn, pow(t,0.7));
  if(d.y<0.0) c = mix(hz, vec3(0.45,0.47,0.42), clamp(-d.y*5.0,0.0,1.0));
  float s = max(dot(d,uSunDir),0.0);
  c += vec3(1.0,0.9,0.7)*(pow(s,600.0)*6.0 + pow(s,12.0)*0.25);
  // soft clouds band
  float cl = sin(d.x*9.0+d.z*4.0)*sin(d.z*7.0-d.x*3.0);
  c = mix(c, vec3(0.93,0.94,0.96), clamp(cl*0.5+0.1,0.0,1.0)*smoothstep(0.05,0.35,d.y)*0.35);
  c = aces(c*uExposure); o = vec4(pow(c,vec3(1.0/2.2)),1.0);
}`;

class Engine {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    if (!gl) throw new Error('webgl2');
    this.gl = gl; this.canvas = canvas;
    this.prog = this._prog(VS, FS); this.sprog = this._prog(SVS, SFS); this.skyprog = this._prog(SKYVS, SKYFS);
    this.u = this._uniforms(this.prog, ['uVP','uModel','uSVP','uUvScale','uTex','uShadow','uSunDir','uSunCol','uSky','uGnd','uInTop','uInBot','uCam','uFog','uTint','uFogD','uSpec','uShin','uAlpha','uEmis','uShTexel','uShadowOn','uRefl','uAlphaTest','uGlass','uExposure']);
    this.su = this._uniforms(this.sprog, ['uVP','uModel','uUvScale','uTex','uAlphaTest']);
    this.ku = this._uniforms(this.skyprog, ['uInvVP','uSunDir','uExposure']);
    this.batches = []; this.dynamic = []; this.overlay = [];
    this.ident = M4.create();
    this.shadowSize = 2048; this.shadowOn = true; this.shadowDirty = true;
    this.maxAniso = 1;
    const ext = gl.getExtension('EXT_texture_filter_anisotropic');
    if (ext) { this.anisoExt = ext; this.maxAniso = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT); }
    // sky quad
    this.skyVao = gl.createVertexArray(); gl.bindVertexArray(this.skyVao);
    const sb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this._initShadow(this.shadowSize);
    this.stats = { calls: 0, tris: 0 };
  }
  _sh(type, src) { const gl = this.gl, s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  _prog(v, f) { const gl = this.gl, p = gl.createProgram(); gl.attachShader(p, this._sh(gl.VERTEX_SHADER, v)); gl.attachShader(p, this._sh(gl.FRAGMENT_SHADER, f));
    gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; }
  _uniforms(p, names) { const o = {}; for (const n of names) o[n] = this.gl.getUniformLocation(p, n); return o; }
  _initShadow(size) {
    const gl = this.gl;
    if (this.shTex) { gl.deleteTexture(this.shTex); gl.deleteFramebuffer(this.shFbo); }
    this.shadowSize = size;
    this.shTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.shTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, size, size);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    this.shFbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, this.shFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.shTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.shadowDirty = true;
  }
  texture(canvas, opts = {}) {
    const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const wrap = opts.clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    if (this.anisoExt) gl.texParameterf(gl.TEXTURE_2D, this.anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(this.maxAniso, opts.aniso || 4));
    return t;
  }
  // geometry: {pos:Float32Array, nrm, uv, col, ext, idx:Uint32Array}
  upload(g) {
    const gl = this.gl, vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const n = g.pos.length / 3, data = new Float32Array(n * 14);
    for (let i = 0; i < n; i++) {
      const o = i * 14;
      data[o] = g.pos[i*3]; data[o+1] = g.pos[i*3+1]; data[o+2] = g.pos[i*3+2];
      data[o+3] = g.nrm[i*3]; data[o+4] = g.nrm[i*3+1]; data[o+5] = g.nrm[i*3+2];
      data[o+6] = g.uv[i*2]; data[o+7] = g.uv[i*2+1];
      data[o+8] = g.col[i*3]; data[o+9] = g.col[i*3+1]; data[o+10] = g.col[i*3+2];
      data[o+11] = g.ext[i*3]; data[o+12] = g.ext[i*3+1]; data[o+13] = g.ext[i*3+2];
    }
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const S = 56;
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, S, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, S, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, S, 24);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 3, gl.FLOAT, false, S, 32);
    gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 3, gl.FLOAT, false, S, 44);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g.idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    // bounds
    let mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9];
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { const v = g.pos[i*3+k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; }
    return { vao, count: g.idx.length, min: mn, max: mx, vb, ib };
  }
  addBatch(mesh, mat, group, model) { const b = { mesh, mat, group, model: model || null, visible: true }; (model ? this.dynamic : this.batches).push(b); return b; }
  setSun(dir) { const l = Math.hypot(...dir); this.sunDir = dir.map(v => v / l); this.shadowDirty = true; }
  _frustum(vp) {
    const p = [], m = vp;
    const rows = (i) => [m[i], m[4+i], m[8+i], m[12+i]];
    const r0 = rows(0), r1 = rows(1), r2 = rows(2), r3 = rows(3);
    for (const [a, s] of [[r0,1],[r0,-1],[r1,1],[r1,-1],[r2,1],[r2,-1]]) {
      const q = [r3[0]+s*a[0], r3[1]+s*a[1], r3[2]+s*a[2], r3[3]+s*a[3]]; p.push(q);
    }
    return p;
  }
  _visible(fr, mn, mx) {
    for (const q of fr) {
      const x = q[0] > 0 ? mx[0] : mn[0], y = q[1] > 0 ? mx[1] : mn[1], z = q[2] > 0 ? mx[2] : mn[2];
      if (q[0]*x + q[1]*y + q[2]*z + q[3] < 0) return false;
    }
    return true;
  }
  renderShadow() {
    const gl = this.gl, s = this.shadowSize, c = this.shadowCenter, R = this.shadowRadius;
    const d = this.sunDir, eye = [c[0] + d[0]*80, c[1] + d[1]*80, c[2] + d[2]*80];
    const view = M4.lookAt(eye, c, [0,1,0]);
    const proj = M4.ortho(-R, R, -R, R, 1, 200);
    this.shadowVP = M4.mul(proj, view);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shFbo); gl.viewport(0, 0, s, s);
    gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.5, 3.0);
    gl.useProgram(this.sprog); gl.uniformMatrix4fv(this.su.uVP, false, this.shadowVP);
    gl.uniform1i(this.su.uTex, 0);
    const all = this.batches.concat(this.dynamic);
    for (const b of all) {
      if (!b.visible || !b.mat.castShadow) continue;
      gl.uniformMatrix4fv(this.su.uModel, false, b.model || this.ident);
      gl.uniform2fv(this.su.uUvScale, b.mat.uvScale);
      gl.uniform1f(this.su.uAlphaTest, b.mat.alphaTest || 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, b.mat.tex);
      gl.bindVertexArray(b.mesh.vao); gl.drawElements(gl.TRIANGLES, b.mesh.count, gl.UNSIGNED_INT, 0);
    }
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.shadowDirty = false;
  }
  render(cam, env) {
    const gl = this.gl;
    if (this.shadowOn && this.shadowDirty) this.renderShadow();
    const w = this.canvas.width, h = this.canvas.height;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0.8, 0.85, 0.9, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const proj = M4.persp(cam.fov, w / h, cam.near, cam.far);
    const view = M4.lookAt(cam.eye, cam.target, [0, 1, 0]);
    const vp = M4.mul(proj, view);
    // sky
    gl.disable(gl.DEPTH_TEST); gl.useProgram(this.skyprog);
    gl.uniformMatrix4fv(this.ku.uInvVP, false, M4.invert(vp)); gl.uniform3fv(this.ku.uSunDir, this.sunDir); gl.uniform1f(this.ku.uExposure, env.exposure || 1.0);
    gl.bindVertexArray(this.skyVao); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.useProgram(this.prog);
    const u = this.u;
    gl.uniformMatrix4fv(u.uVP, false, vp); gl.uniformMatrix4fv(u.uSVP, false, this.shadowVP || this.ident);
    gl.uniform3fv(u.uSunDir, this.sunDir); gl.uniform3fv(u.uSunCol, env.sunCol);
    gl.uniform3fv(u.uSky, env.sky); gl.uniform3fv(u.uGnd, env.gnd); gl.uniform3fv(u.uInTop, env.inTop); gl.uniform3fv(u.uInBot, env.inBot);
    gl.uniform3fv(u.uCam, cam.eye); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); gl.uniform1f(u.uExposure, env.exposure || 1.0);
    gl.uniform1f(u.uShTexel, 1 / this.shadowSize); gl.uniform1f(u.uShadowOn, this.shadowOn ? 1 : 0);
    gl.uniform1i(u.uTex, 0); gl.uniform1i(u.uShadow, 1);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.shTex);
    const fr = this._frustum(vp);
    let calls = 0, tris = 0;
    const draw = (b) => {
      const m = b.mat;
      if (b.model) {
        if (b.cull && !this._visible(fr, b.cull[0], b.cull[1])) return;
        // small indoor parts (cabinet doors, drawers): only drawn from nearby on the same floor
        if (b.near) { const n = b.near, e = cam.eye; if (Math.abs(e[1] - n[1]) > 2.4 || (e[0] - n[0]) * (e[0] - n[0]) + (e[2] - n[2]) * (e[2] - n[2]) > 81) return; }
        gl.uniformMatrix4fv(u.uModel, false, b.model);
      }
      else { if (!this._visible(fr, b.mesh.min, b.mesh.max)) return; gl.uniformMatrix4fv(u.uModel, false, this.ident); }
      if (m.cull === false) gl.disable(gl.CULL_FACE); else gl.enable(gl.CULL_FACE);
      gl.uniform2fv(u.uUvScale, m.uvScale); gl.uniform3fv(u.uTint, m.tint);
      gl.uniform1f(u.uSpec, m.spec); gl.uniform1f(u.uShin, m.shin); gl.uniform1f(u.uAlpha, m.alpha);
      gl.uniform1f(u.uEmis, m.emis); gl.uniform1f(u.uRefl, m.refl); gl.uniform1f(u.uAlphaTest, m.alphaTest || 0); gl.uniform1f(u.uGlass, m.glass || 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, m.tex);
      gl.bindVertexArray(b.mesh.vao); gl.drawElements(gl.TRIANGLES, b.mesh.count, gl.UNSIGNED_INT, 0);
      calls++; tris += b.mesh.count / 3;
    };
    gl.disable(gl.BLEND); gl.depthMask(true);
    for (const b of this.batches) if (b.visible && !b.mat.transparent) draw(b);
    for (const b of this.dynamic) if (b.visible && !b.mat.transparent) draw(b);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    const tr = this.batches.concat(this.dynamic).filter(b => b.visible && b.mat.transparent);
    const e = cam.eye;
    tr.sort((a, b) => {
      const ca = a.mesh.center || (a.mesh.center = a.mesh.min.map((v, i) => (v + a.mesh.max[i]) / 2));
      const cb = b.mesh.center || (b.mesh.center = b.mesh.min.map((v, i) => (v + b.mesh.max[i]) / 2));
      return Math.hypot(cb[0]-e[0], cb[1]-e[1], cb[2]-e[2]) - Math.hypot(ca[0]-e[0], ca[1]-e[1], ca[2]-e[2]);
    });
    for (const b of tr) draw(b);
    gl.depthMask(true); gl.disable(gl.BLEND);
    // hand-held items: drawn last over a cleared depth buffer so they never clip into walls
    const ov = this.overlay.filter(b => b.visible);
    if (ov.length) {
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(u.uVP, false, M4.mul(M4.persp(cam.vmFov || cam.fov, w / h, 0.01, 20), view));
      for (const b of ov) draw(b);
    }
    this.stats.calls = calls; this.stats.tris = tris;
  }
}
