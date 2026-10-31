// Renders one yacht model in one view as a photo-style 3D image.
// Loaded by render.html in headless Chromium (see render.mjs). Query string:
//   ?m=<json model params>&view=sailing|profile|anchored|aerial
// Sets window.done = true when the frame is drawn; window.result holds a data URL.
//
// The boat is generic for its type (catamaran or monohull) but built from the
// model's own length, beam and draft, so sizes and proportions differ per model.

import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { Water } from "three/addons/objects/Water.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const q = new URLSearchParams(location.search);
const M = JSON.parse(q.get("m"));
const VIEW = q.get("view") ?? "sailing";
const W = Number(q.get("w") ?? 1600);
const H = Number(q.get("h") ?? 1000);
const SS = Number(q.get("ss") ?? 2); // supersampling

const L = M.L;
const B = M.B;
const CAT = M.kind === "catamaran";
const UNDER_SAIL = VIEW === "sailing" || VIEW === "profile";

// ── Renderer, sky, sea ──────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(SS);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const LIGHT = {
  sailing: { elev: 30, azim: 92, exposure: 0.55, turbidity: 1.1, rayleigh: 0.45, mie: 0.002, water: 0x1466a0, sun: 0xfff5e8, sunI: 2.6 },
  profile: { elev: 36, azim: 80, exposure: 0.55, turbidity: 1.1, rayleigh: 0.45, mie: 0.002, water: 0x1466a0, sun: 0xfff5e8, sunI: 2.6 },
  anchored: { elev: 6, azim: 215, exposure: 0.6, turbidity: 8, rayleigh: 2.5, mie: 0.007, water: 0x0e3e5e, sun: 0xffa95c, sunI: 3.2 },
  aerial: { elev: 62, azim: 150, exposure: 0.5, turbidity: 1.1, rayleigh: 0.45, mie: 0.002, water: 0x1aa0ae, sun: 0xffffff, sunI: 2.3 },
}[VIEW];
// Tuning override: &sky=turbidity,rayleigh,mie,elev,azim,exposure,waterHex
if (q.get("sky")) {
  const [t, r, mi, e, a, x, w] = q.get("sky").split(",");
  Object.assign(LIGHT, { turbidity: +t, rayleigh: +r, mie: +mi, elev: +e, azim: +a, exposure: +x, ...(w ? { water: parseInt(w, 16) } : {}) });
}
renderer.toneMappingExposure = LIGHT.exposure;

const sun = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - LIGHT.elev), THREE.MathUtils.degToRad(LIGHT.azim));

const sky = new Sky();
sky.scale.setScalar(20000);
const su = sky.material.uniforms;
su.turbidity.value = LIGHT.turbidity;
su.rayleigh.value = LIGHT.rayleigh;
su.mieCoefficient.value = LIGHT.mie;
su.mieDirectionalG.value = 0.82;
su.sunPosition.value.copy(sun);

// A tileable normal map for the sea surface (no external textures).
function seaNormals(size = 512) {
  const heights = new Float32Array(size * size);
  const rnd = mulberry(7);
  for (let o = 0; o < 6; o++) {
    const cells = 4 << o;
    const lattice = Array.from({ length: cells * cells }, () => rnd());
    const amp = Math.pow(0.55, o);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const fx = (x / size) * cells, fy = (y / size) * cells;
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        const tx = smooth(fx - x0), ty = smooth(fy - y0);
        const v = (i, j) => lattice[((j % cells) * cells) + (i % cells)];
        const a = v(x0, y0), b = v(x0 + 1, y0), c = v(x0, y0 + 1), d = v(x0 + 1, y0 + 1);
        heights[y * size + x] += amp * (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty);
      }
  }
  const data = new Uint8Array(size * size * 4);
  const hAt = (x, y) => heights[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const nx = (hAt(x - 1, y) - hAt(x + 1, y)) * 9, ny = (hAt(x, y - 1) - hAt(x, y + 1)) * 9;
      const len = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  const t = new THREE.DataTexture(data, size, size);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}
function smooth(t) { return t * t * (3 - 2 * t); }
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const water = new Water(new THREE.PlaneGeometry(20000, 20000), {
  textureWidth: 1024,
  textureHeight: 1024,
  waterNormals: seaNormals(),
  sunDirection: sun.clone().normalize(),
  sunColor: LIGHT.sun,
  waterColor: LIGHT.water,
  distortionScale: VIEW === "aerial" ? 1.6 : 2.6,
});
// Let the sea's own colour show: Water.js is almost a mirror at low angles.
water.material.fragmentShader = water.material.fragmentShader
  .replace("vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;", "vec3 scatter = ( 0.55 + 0.45 * max( 0.0, dot( surfaceNormal, eyeDirection ) ) ) * waterColor;")
  .replace("float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );", "float reflectance = ( rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 ) ) * 0.4;");
water.material.needsUpdate = true;
water.rotation.x = -Math.PI / 2;
water.material.uniforms.size.value = VIEW === "aerial" ? 3.5 : 2.2;
water.material.uniforms.time.value = 12;
scene.add(water);

// Environment lighting from the sky, then the sky itself in view.
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
envScene.add(sky);
scene.environment = pmrem.fromScene(envScene).texture;
scene.add(sky);
scene.environmentIntensity = VIEW === "anchored" ? 0.7 : 0.55;

const sunLight = new THREE.DirectionalLight(LIGHT.sun, LIGHT.sunI);
sunLight.position.copy(sun).multiplyScalar(80);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(4096, 4096);
const sc = sunLight.shadow.camera;
sc.left = sc.bottom = -L * 1.2;
sc.right = sc.top = L * 1.2;
sc.near = 1;
sc.far = 250;
sunLight.shadow.bias = -0.0004;
sunLight.shadow.normalBias = 0.02;
scene.add(sunLight);

// ── Materials ───────────────────────────────────────────────────────────────
const gelcoat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12, side: THREE.DoubleSide });
const deckMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide });
const white = new THREE.MeshPhysicalMaterial({ color: 0xf3f3f0, roughness: 0.3, clearcoat: 0.8, side: THREE.DoubleSide });
const glass = new THREE.MeshPhysicalMaterial({ color: 0x0b141c, roughness: 0.04, metalness: 0.1, clearcoat: 1, side: THREE.DoubleSide });
const steel = new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: 0.85, roughness: 0.25 });
const mastMat = new THREE.MeshStandardMaterial({ color: M.mastColor ?? 0xe6e8ea, metalness: 0.5, roughness: 0.35 });
const wire = new THREE.MeshStandardMaterial({ color: 0x5a6068, metalness: 0.7, roughness: 0.4 });
const sailMat = new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.85, side: THREE.DoubleSide });
const canvas = new THREE.MeshStandardMaterial({ color: M.canvas ?? 0x2c3a4a, roughness: 0.9, side: THREE.DoubleSide });
const teak = new THREE.MeshStandardMaterial({ color: 0x8a6847, roughness: 0.8 });
const dark = new THREE.MeshStandardMaterial({ color: 0x1d2329, roughness: 0.6 });
const trampMat = new THREE.MeshStandardMaterial({ color: 0x2b3036, roughness: 0.95, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });

const C = (hex) => new THREE.Color(hex);
const HULL_WHITE = C(M.hull ?? 0xf5f5f2);
const STRIPE = C(M.stripe ?? 0x1f2d3d);
const ANTIFOUL = C(0x1a222c);
const GLASS = C(0x0e1820);
const NONSKID = C(0xe7e4dc);
const TEAK = C(0x8d6a48);

const boat = new THREE.Group();
scene.add(boat);
const add = (geo, mat, parent = boat) => {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
};

// ── Geometry helpers ────────────────────────────────────────────────────────
/** Build an indexed grid mesh from rows of points (each row the same length). */
function gridGeometry(rows, colorFn) {
  const R = rows.length, P = rows[0].length;
  const pos = [], col = [], idx = [];
  for (let r = 0; r < R; r++)
    for (let p = 0; p < P; p++) {
      const v = rows[r][p];
      pos.push(v.x, v.y, v.z);
      const c = colorFn ? colorFn(r / (R - 1), p, v) : HULL_WHITE;
      col.push(c.r, c.g, c.b);
    }
  for (let r = 0; r < R - 1; r++)
    for (let p = 0; p < P - 1; p++) {
      const a = r * P + p, b = a + 1, c = a + P, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A cylinder between two points. */
function rod(a, b, r, mat, parent = boat) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const g = new THREE.CylinderGeometry(r, r, len, 10, 1);
  const m = add(g, mat, parent);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

const box = (w, h, d, mat, x, y, z, parent = boat) => {
  const m = add(new THREE.BoxGeometry(w, h, d), mat, parent);
  m.position.set(x, y, z);
  return m;
};

/**
 * Loft one hull. t runs 0 (transom) → 1 (bow); x = x0 + t·len.
 * half(t): half-breadth at the sheer; sheer(t): deck edge height; depth(t): canoe body depth.
 * windows: [[t0, t1, yLo, yHi]] painted dark on the outer side (side=+1 starboard, −1 port, 0 both).
 */
function hull({ x0, len, z0 = 0, half, sheer, depth, windows = [], outer = 0, S = 170 }) {
  const NT = 16, NB = 20, n = 2.4;
  const rows = [];
  for (let s = 0; s <= S; s++) {
    const t = s / S;
    const x = x0 + t * len;
    const b = Math.max(0.004, half(t)), h = sheer(t), d = depth(t);
    const yb = Math.min(0.18, h * 0.25);
    const star = [];
    for (let j = 0; j <= NT; j++) star.push([b * (1 - 0.02 * (j / NT)), h - (h - yb) * (j / NT)]);
    for (let k = 1; k <= NB; k++) {
      const ph = (k / NB) * (Math.PI / 2);
      star.push([b * 0.98 * Math.pow(Math.cos(ph), 2 / n), yb - (yb + d) * Math.pow(Math.sin(ph), 2 / n)]);
    }
    const row = [];
    for (const [z, y] of star) row.push(new THREE.Vector3(x, y, z0 + z));
    for (let i = star.length - 2; i >= 0; i--) row.push(new THREE.Vector3(x, star[i][1], z0 - star[i][0]));
    rows.push(row);
  }
  const P = rows[0].length;
  const geo = gridGeometry(rows, (t, p, v) => {
    const side = p < P / 2 ? 1 : -1;
    if (v.y < -0.01) return ANTIFOUL;
    if (v.y < 0.13) return STRIPE;
    for (const [a, b2, lo, hi] of windows) if (t >= a && t <= b2 && v.y >= lo && v.y <= hi && (outer === 0 || outer === side)) return GLASS;
    return HULL_WHITE;
  });
  add(geo, gelcoat);
  // Transom cap.
  const tr = rows[0];
  const capPos = [], capIdx = [];
  const cx = tr[0].x, cy = tr.reduce((a, v) => a + v.y, 0) / tr.length;
  capPos.push(cx, cy, z0);
  for (const v of tr) capPos.push(v.x, v.y, v.z);
  for (let i = 1; i < tr.length; i++) capIdx.push(0, i, i + 1);
  const cap = new THREE.BufferGeometry();
  cap.setAttribute("position", new THREE.Float32BufferAttribute(capPos, 3));
  const cc = [];
  for (let i = 0; i <= tr.length; i++) {
    const y = capPos[i * 3 + 1];
    const c = y < -0.01 ? ANTIFOUL : y < 0.13 ? STRIPE : HULL_WHITE;
    cc.push(c.r, c.g, c.b);
  }
  cap.setAttribute("color", new THREE.Float32BufferAttribute(cc, 3));
  cap.setIndex(capIdx);
  cap.setAttribute("normal", new THREE.Float32BufferAttribute(Array.from({ length: tr.length + 1 }, () => [-1, 0, 0]).flat(), 3));
  add(cap, gelcoat);
  return rows;
}

/** A cambered deck over a hull. teakZone(t, zFrac) → true paints it teak. */
function deck({ x0, len, z0 = 0, half, sheer, camber = 0.05, teakZone = () => false, S = 120 }) {
  const rows = [];
  for (let s = 0; s <= S; s++) {
    const t = s / S;
    const b = Math.max(0.004, half(t)), h = sheer(t);
    const row = [];
    for (let i = -6; i <= 6; i++) {
      const f = i / 6;
      row.push(new THREE.Vector3(x0 + t * len, h + camber * (1 - f * f), z0 + f * b));
    }
    rows.push(row);
  }
  add(gridGeometry(rows, (t, p) => (teakZone(t, Math.abs(p - 6) / 6) ? TEAK : NONSKID)), deckMat);
}

/** Stanchions and two lifelines along a deck edge between t0 and t1. */
function lifelines({ x0, len, z0 = 0, half, sheer, t0, t1, side, every = 1.9 }) {
  const n = Math.max(2, Math.round(((t1 - t0) * len) / every));
  let prevLo = null, prevHi = null;
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n;
    const x = x0 + t * len, z = z0 + side * half(t) * 0.95, y = sheer(t);
    const lo = new THREE.Vector3(x, y + 0.36, z), hi = new THREE.Vector3(x, y + 0.66, z);
    rod(new THREE.Vector3(x, y, z), hi, 0.014, steel);
    if (prevLo) {
      rod(prevLo, lo, 0.005, wire);
      rod(prevHi, hi, 0.005, wire);
    }
    prevLo = lo;
    prevHi = hi;
  }
}

/** A cambered sail surface. luff(v) → point on the luff; chord(v) → length; dir: leeward unit z (+1/−1). */
function sail({ luff, chord, sheetDeg, twistDeg, camber, side, rows = 28, cols = 18, aftX = -1 }) {
  const grid = [];
  for (let r = 0; r <= rows; r++) {
    const v = r / rows;
    const p0 = luff(v), c = chord(v);
    const a = THREE.MathUtils.degToRad(sheetDeg + twistDeg * v);
    const d = new THREE.Vector3(aftX * Math.cos(a), 0, side * Math.sin(a));
    const nrm = new THREE.Vector3(Math.sin(a) * side * 0.0, 0, side * Math.cos(a));
    const row = [];
    for (let k = 0; k <= cols; k++) {
      const u = k / cols;
      const bulge = camber * c * 4 * u * (1 - u) * (1 - 0.35 * u) * (0.8 + 0.4 * (1 - v));
      row.push(p0.clone().addScaledVector(d, c * u).addScaledVector(nrm, bulge));
    }
    grid.push(row);
  }
  add(gridGeometry(grid), sailMat);
}

// ── The boat ────────────────────────────────────────────────────────────────
const x0 = -L / 2;
const side = -1; // leeward is port: the boat heels away from a starboard-side camera
let mastX, mastBaseY, mastTopY, boomY, boomAftX, deckTopY, bowX, bowY, sternX;

if (CAT) {
  const hb = 0.135 * B; // hull half-breadth at the sheer
  const zc = B / 2 - hb;
  const fb = THREE.MathUtils.clamp(0.125 * L, 1.45, 2.15);
  const half = (t) => hb * (t < 0.55 ? 1 - 0.06 * (1 - t / 0.55) : Math.pow(Math.cos(((t - 0.55) / 0.45) * (Math.PI / 2)), 0.65));
  const sheer = (t) => fb * (1 + 0.08 * t * t);
  const depth = (t) => 0.05 * L * Math.pow(Math.sin(Math.PI * Math.min(t * 1.02, 1)), 0.55) + 0.015 * L * t + 0.18 * (1 - t);
  const win = [[0.18, 0.3, fb * 0.5, fb * 0.66], [0.38, 0.62, fb * 0.5, fb * 0.66], [0.68, 0.76, fb * 0.5, fb * 0.66]];
  for (const s of [1, -1]) {
    hull({ x0, len: L, z0: s * zc, half, sheer, depth, windows: win, outer: s });
    deck({ x0, len: L, z0: s * zc, half, sheer, camber: 0.03 });
    lifelines({ x0, len: L, z0: s * zc, half, sheer, t0: 0.62, t1: 0.95, side: s });
    // Transom steps.
    for (let k = 0; k < 3; k++) box(0.32, 0.06, hb * 1.4, teak, x0 + 0.16 + k * 0.3, 0.3 + k * fb * 0.25, s * zc);
  }
  // Bridgedeck and saloon.
  const bdX0 = x0 + 0.1 * L, bdX1 = x0 + 0.74 * L, under = 0.85;
  const span = 2 * zc;
  const bd = new THREE.Shape();
  bd.moveTo(bdX0, under);
  bd.lineTo(bdX1 - 0.6, under + 0.1);
  bd.lineTo(bdX1, fb * 0.85);
  bd.lineTo(bdX1, fb);
  bd.lineTo(bdX0, fb);
  bd.closePath();
  const bdGeo = new THREE.ExtrudeGeometry(bd, { depth: span, bevelEnabled: false });
  bdGeo.translate(0, 0, -zc);
  add(bdGeo, white);
  // Cockpit floor.
  box(0.2 * L, 0.04, span * 0.92, teak, bdX0 + 0.1 * L, fb + 0.02, 0);
  const cabX0 = x0 + 0.27 * L, cabX1 = x0 + 0.7 * L, cabH = THREE.MathUtils.clamp(0.15 * L, 1.95, 2.25);
  const roofY = fb + cabH;
  const cw = B / 2 - 0.55;
  const cab = new THREE.Shape();
  cab.moveTo(cabX0, fb);
  cab.lineTo(cabX1, fb);
  cab.lineTo(cabX1 - 0.25, fb + cabH * 0.45);
  cab.lineTo(cabX1 - 1.1, roofY);
  cab.lineTo(cabX0, roofY);
  cab.closePath();
  const cabGeo = new THREE.ExtrudeGeometry(cab, { depth: cw * 2, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 3 });
  cabGeo.translate(0, 0, -cw);
  add(cabGeo, white);
  // Wraparound saloon glass: front and sides.
  {
    const ax = cabX1 - 0.28, ay = fb + cabH * 0.47, bx = cabX1 - 1.08, by = roofY - 0.06, w = cw * 0.96;
    const nx = (by - ay), ny = -(bx - ax), nl = Math.hypot(nx, ny);
    const o = 0.13;
    const pts = [[ax, ay, -w], [ax, ay, w], [bx, by, w], [bx, by, -w]].map(([x, y, z]) => [x + (nx / nl) * o, y + (ny / nl) * o, z]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeVertexNormals();
    add(g, glass);
  }
  for (const s of [1, -1]) box((cabX1 - cabX0) * 0.78, cabH * 0.42, 0.03, glass, (cabX0 + cabX1) / 2 - 0.25, fb + cabH * 0.62, s * (cw + 0.07));
  // Aft saloon doors.
  box(0.03, cabH * 0.8, cw * 1.2, glass, cabX0 - 0.07, fb + cabH * 0.45, 0);
  // Hardtop over the cockpit, on two posts.
  box(cabX1 - bdX0 - 0.6, 0.12, cw * 2 + 0.3, white, (bdX0 + cabX1 - 0.6) / 2 + 0.05, roofY + 0.06, 0);
  for (const s of [1, -1]) rod(new THREE.Vector3(bdX0 + 0.25, fb, s * (cw - 0.1)), new THREE.Vector3(bdX0 + 0.25, roofY, s * (cw - 0.1)), 0.05, steel);
  deckTopY = roofY + 0.12;
  // Flybridge (most of the fleet) or a plain hardtop.
  if (M.fly) {
    const fx = cabX0 + 0.25 * (cabX1 - cabX0);
    box(2.2, 0.55, cw * 1.3, white, fx, deckTopY + 0.27, 0);
    const bimH = deckTopY + 1.95;
    box(2.9, 0.05, cw * 1.45, canvas, fx - 0.1, bimH, 0);
    for (const s of [1, -1]) for (const dx of [-1.2, 1.1]) rod(new THREE.Vector3(fx + dx, deckTopY, s * cw * 0.66), new THREE.Vector3(fx + dx, bimH, s * cw * 0.66), 0.025, steel);
    const wheel = add(new THREE.TorusGeometry(0.35, 0.025, 8, 28), steel);
    wheel.position.set(fx + 0.6, deckTopY + 1.05, 0.5);
    wheel.rotation.y = Math.PI / 2;
  }
  // Trampoline and crossbeam.
  const tx0 = x0 + 0.74 * L, tx1 = x0 + 0.955 * L;
  const tramp = add(new THREE.PlaneGeometry(tx1 - tx0, span - hb * 1.4), trampMat);
  tramp.rotation.x = -Math.PI / 2;
  tramp.position.set((tx0 + tx1) / 2, fb * 1.03, 0);
  rod(new THREE.Vector3(tx1, fb * 1.06, -zc), new THREE.Vector3(tx1, fb * 1.06, zc), 0.11, white);
  rod(new THREE.Vector3(x0 + 0.66 * L, fb * 1.06, 0), new THREE.Vector3(tx1 + 0.15, fb * 1.06, 0), 0.08, white);
  mastX = x0 + 0.62 * L;
  mastBaseY = roofY;
  mastTopY = THREE.MathUtils.clamp(1.62 * L, 19, 28.5);
  boomY = deckTopY + (M.fly ? 2.4 : 1.2);
  boomAftX = x0 + 0.16 * L;
  bowX = x0 + 0.965 * L;
  bowY = fb * 1.06;
  sternX = x0;
} else {
  const hb = B / 2;
  const fb = THREE.MathUtils.clamp(0.093 * L, 1.15, 1.75);
  const half = (t) => hb * (t < 0.38 ? 0.86 + 0.14 * Math.sin((t / 0.38) * (Math.PI / 2)) : Math.pow(Math.cos(((t - 0.38) / 0.62) * (Math.PI / 2)), 0.72));
  const sheer = (t) => fb * (1 + 0.13 * t * t);
  const depth = (t) => 0.042 * L * Math.pow(Math.sin(Math.PI * Math.min(t * 1.02, 1)), 0.6) + 0.018 * L * t + 0.08 * (1 - t);
  const win = [[0.44, 0.63, fb * 0.5, fb * 0.66], [0.13, 0.2, fb * 0.52, fb * 0.62], [0.7, 0.76, fb * 0.56, fb * 0.66]];
  hull({ x0, len: L, half, sheer, depth, windows: win });
  deck({ x0, len: L, half, sheer, camber: 0.06, teakZone: (t, f) => t > 0.02 && t < 0.3 && f < 0.78 });
  for (const s of [1, -1]) lifelines({ x0, len: L, half, sheer, t0: 0.06, t1: 0.92, side: s });
  // Keel and rudder (mostly underwater, seen at the waterline in clear water).
  box(1.3, M.draft - 0.5, 0.18, dark, x0 + 0.5 * L, -(M.draft + 0.5) / 2, 0);
  box(0.5, 1.4, 0.08, dark, x0 + 0.1 * L, -0.8, 0);
  // Coachroof, lofted.
  const tA = 0.33, tB = 0.67, NS = 40;
  const roofRows = [];
  for (let s = 0; s <= NS; s++) {
    const t = tA + ((tB - tA) * s) / NS;
    const wb = half(t) * 0.62, wt = wb * 0.84;
    const k = (t - tA) / (tB - tA);
    const hc = k > 0.85 ? 0.52 * (1 - (k - 0.85) / 0.15) + 0.06 : 0.44 + 0.08 * k;
    const y0 = sheer(t) + 0.05;
    const x = x0 + t * L;
    roofRows.push([
      new THREE.Vector3(x, y0, wb),
      new THREE.Vector3(x, y0 + hc * 0.35, wb * 0.97),
      new THREE.Vector3(x, y0 + hc * 0.72, wb * 0.91),
      new THREE.Vector3(x, y0 + hc, wt),
      new THREE.Vector3(x, y0 + hc + 0.05, 0),
      new THREE.Vector3(x, y0 + hc, -wt),
      new THREE.Vector3(x, y0 + hc * 0.72, -wb * 0.91),
      new THREE.Vector3(x, y0 + hc * 0.35, -wb * 0.97),
      new THREE.Vector3(x, y0, -wb),
    ]);
  }
  add(gridGeometry(roofRows, (t, p) => ((p === 1 || p === 2 || p === 6 || p === 7) && t > 0.12 && t < 0.86 ? GLASS : t > 0.86 && p > 1 && p < 7 ? GLASS : HULL_WHITE)), gelcoat);
  const roofTop = sheer(0.5) + 0.05 + 0.48;
  // Hatches.
  for (const tt of [0.42, 0.55]) box(0.55, 0.04, 0.55, glass, x0 + tt * L, roofTop + 0.03, 0);
  // Sprayhood (dodger) at the companionway.
  const dodger = add(new THREE.CylinderGeometry(0.62, 0.62, half(0.33) * 1.15, 24, 1, true, 0, Math.PI), canvas);
  dodger.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  dodger.scale.set(1, 1, 1.15);
  dodger.position.set(x0 + 0.31 * L, sheer(0.33) + 0.42, 0);
  // Twin wheels and cockpit table.
  for (const s of [1, -1]) {
    const w = add(new THREE.TorusGeometry(0.5, 0.025, 8, 32), steel);
    w.position.set(x0 + 0.09 * L, sheer(0.09) + 0.62, s * hb * 0.48);
    w.rotation.y = Math.PI / 2;
    rod(new THREE.Vector3(x0 + 0.09 * L + 0.05, sheer(0.09), s * hb * 0.48), new THREE.Vector3(x0 + 0.09 * L + 0.05, sheer(0.09) + 0.62, s * hb * 0.48), 0.05, steel);
  }
  box(0.9, 0.5, 0.55, teak, x0 + 0.2 * L, sheer(0.2) + 0.28, 0);
  // Cockpit coamings.
  for (const s of [1, -1]) box(0.22 * L, 0.3, 0.06, white, x0 + 0.2 * L, sheer(0.2) + 0.15, s * hb * 0.8);
  // Bathing platform.
  box(0.7, 0.07, hb * 1.4, teak, x0 - 0.25, 0.45, 0);
  mastX = x0 + 0.585 * L;
  mastBaseY = roofTop;
  mastTopY = THREE.MathUtils.clamp(1.45 * L, 18, 28);
  boomY = sheer(0.4) + 2.25;
  boomAftX = x0 + 0.1 * L;
  bowX = x0 + L;
  bowY = sheer(1) + 0.08;
  sternX = x0;
  deckTopY = roofTop;
}

// ── Rig ─────────────────────────────────────────────────────────────────────
const mastR = 0.085 * (L / 14);
rod(new THREE.Vector3(mastX, mastBaseY, 0), new THREE.Vector3(mastX, mastTopY, 0), mastR, mastMat);
const spreaders = CAT ? [0.45, 0.72] : [0.38, 0.62, 0.82];
const halfSpread = CAT ? 1.35 : 1.0;
for (const f of spreaders) {
  const y = mastBaseY + (mastTopY - mastBaseY) * f;
  rod(new THREE.Vector3(mastX - 0.25, y, -halfSpread * (1 - f * 0.4)), new THREE.Vector3(mastX - 0.25, y, halfSpread * (1 - f * 0.4)), 0.025, mastMat);
}
const head = new THREE.Vector3(mastX, mastTopY - 0.1, 0);
const fsTop = new THREE.Vector3(mastX, mastBaseY + (mastTopY - mastBaseY) * (CAT ? 0.86 : 0.88), 0);
const bowPt = new THREE.Vector3(bowX, bowY, 0);
rod(fsTop, bowPt, 0.01, wire);
for (const s of [1, -1]) {
  const chain = CAT ? new THREE.Vector3(mastX - 0.6, mastBaseY - 0.2, s * (B / 2 - 0.3)) : new THREE.Vector3(mastX - 0.4, mastBaseY - 0.5, s * (B / 2) * 0.92);
  rod(chain, head, 0.009, wire);
  if (!CAT) rod(new THREE.Vector3(sternX + 0.15, bowY - 0.1, s * (B / 2) * 0.7), head, 0.008, wire);
}
// Boom.
rod(new THREE.Vector3(mastX - 0.1, boomY, 0), new THREE.Vector3(boomAftX, boomY + 0.2, 0), mastR * 0.85, mastMat);

if (UNDER_SAIL) {
  const luffBottom = boomY + 0.15;
  const footLen = mastX - boomAftX - 0.2;
  // Mainsail (square-top on the catamarans).
  sail({
    luff: (v) => new THREE.Vector3(mastX - 0.12, luffBottom + (mastTopY - 0.6 - luffBottom) * v, 0),
    chord: (v) => footLen * (CAT ? 0.82 * Math.pow(1 - v, 0.75) + 0.16 + 0.1 * v * (1 - v) : Math.pow(1 - v, 0.85) + 0.08 * v * (1 - v) + 0.02),
    sheetDeg: 9,
    twistDeg: 12,
    camber: 0.09,
    side,
  });
  // Headsail: genoa on monohulls, self-tacker on catamarans.
  const tack = bowPt.clone().add(new THREE.Vector3(-0.15, 0.6, 0));
  const jibHead = tack.clone().lerp(fsTop, 0.92);
  const jibFoot = CAT ? (bowX - mastX) * 0.95 : (bowX - mastX) * 1.18;
  sail({
    luff: (v) => tack.clone().lerp(jibHead, v),
    chord: (v) => jibFoot * Math.pow(1 - v, 0.95) + 0.05,
    sheetDeg: 11,
    twistDeg: 10,
    camber: 0.11,
    side,
  });
} else {
  // Furled: a slim roll on the forestay; mainsail stowed in the mast.
  rod(bowPt.clone().add(new THREE.Vector3(-0.12, 0.6, 0)), fsTop.clone().lerp(bowPt, 0.06), 0.07, sailMat);
  // Bimini over the cockpit at anchor (monohulls).
  if (!CAT) {
    const bx = x0 + 0.17 * L;
    const top = sheerY(0.17) + 2.05, w = B * 0.38, rows = [];
    for (let i = 0; i <= 10; i++) {
      const x = bx - 1.1 + (2.2 * i) / 10, row = [];
      for (let k = -8; k <= 8; k++) row.push(new THREE.Vector3(x, top - 0.35 * Math.pow(k / 8, 2), (k / 8) * w));
      rows.push(row);
    }
    add(gridGeometry(rows), canvas);
    for (const s of [1, -1]) for (const dx of [-1.05, 1.05]) rod(new THREE.Vector3(bx + dx, sheerY(0.17), s * w * 0.97), new THREE.Vector3(bx + dx, top - 0.35, s * w * 0.97), 0.018, steel);
  }
  // Anchor chain into the water.
  rod(bowPt.clone().add(new THREE.Vector3(0.1, -0.2, 0)), new THREE.Vector3(bowX + 4.5, -0.4, 0.5), 0.02, dark);
}
function sheerY(t) { return CAT ? 0 : THREE.MathUtils.clamp(0.093 * L, 1.15, 1.75) * (1 + 0.13 * t * t); }

// ── Foam ────────────────────────────────────────────────────────────────────
function foamTexture(kind) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d");
  const rnd = mulberry(kind === "wake" ? 11 : 5);
  for (let i = 0; i < 9000; i++) {
    const x = rnd() * 512, y = rnd() * 256;
    const v = y / 256; // 0 inner/near → 1 outer/far
    let a;
    if (kind === "wake") {
      const u = x / 512; // 0 at the stern → 1 far astern
      const centre = Math.exp(-Math.pow((v - 0.5) / (0.06 + 0.12 * u), 2));
      const arms = Math.exp(-Math.pow((Math.abs(v - 0.5) - 0.44) / 0.035, 2));
      a = (centre * 0.9 + arms * 0.55) * Math.pow(1 - u, 1.6);
    } else {
      a = Math.pow(1 - v, 2.2);
    }
    if (rnd() > a) continue;
    g.fillStyle = `rgba(255,255,255,${0.25 + 0.5 * rnd()})`;
    g.beginPath();
    g.ellipse(x, y, 1 + rnd() * 5, 0.6 + rnd() * 2.2, 0, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function ribbon(points, mat) {
  // points: [[inner, outer], ...] along the hull
  const pos = [], uv = [], idx = [];
  points.forEach(([a, b], i) => {
    const u = i / (points.length - 1);
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    uv.push(u, 1, u, 0);
    if (i > 0) {
      const k = i * 2;
      idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, mat);
  m.renderOrder = 2;
  scene.add(m);
}
function foam(hullCentres, halfAtWl) {
  const edge = new THREE.MeshBasicMaterial({ map: foamTexture("edge"), polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8, transparent: true, depthWrite: false, opacity: 0.9, side: THREE.DoubleSide, toneMapped: false });
  for (const zc of hullCentres)
    for (const s of [1, -1]) {
      const pts = [];
      for (let i = 0; i <= 80; i++) {
        const t = i / 80;
        const x = x0 + t * L, b = halfAtWl(t);
        const w = 0.25 + 1.6 * Math.pow(Math.max(0, (t - 0.55) / 0.45), 1.5) + 0.5 * Math.pow(1 - t, 3);
        pts.push([new THREE.Vector3(x, 0.06, zc + s * b * 0.98), new THREE.Vector3(x + (t > 0.85 ? 0.4 : 0), 0.06, zc + s * (b + w))]);
      }
      ribbon(pts, edge);
    }
  const wakeMat = new THREE.MeshBasicMaterial({ map: foamTexture("wake"), polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8, transparent: true, depthWrite: false, opacity: 0.85, side: THREE.DoubleSide, toneMapped: false });
  const len = L * 2.6, w0 = (hullCentres.length > 1 ? B : B * 0.8) * 0.55, spread = Math.tan(THREE.MathUtils.degToRad(19));
  const wake = new THREE.BufferGeometry();
  const P = [];
  for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
    const x = x0 - u * len, half = w0 + u * len * spread;
    P.push(x, 0.05, (v - 0.5) * 2 * half);
  }
  wake.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  wake.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  wake.setIndex([0, 1, 2, 0, 2, 3]);
  const wm = new THREE.Mesh(wake, wakeMat);
  wm.renderOrder = 2;
  scene.add(wm);
}
if (UNDER_SAIL) {
  if (CAT) {
    const hb = 0.135 * B;
    foam([B / 2 - hb, -(B / 2 - hb)], (t) => hb * 0.9 * (t < 0.55 ? 1 : Math.pow(Math.cos(((t - 0.55) / 0.45) * (Math.PI / 2)), 0.65)));
  } else {
    foam([0], (t) => (B / 2) * 0.88 * (t < 0.38 ? 0.8 + 0.2 * Math.sin((t / 0.38) * (Math.PI / 2)) : Math.pow(Math.cos(((t - 0.38) / 0.62) * (Math.PI / 2)), 0.72)));
  }
}

// Heel and pitch under sail.
if (UNDER_SAIL) {
  boat.rotation.x = THREE.MathUtils.degToRad(CAT ? -1 : -11) * side * -1;
  boat.position.y = CAT ? 0 : -0.12;
}

// ── Camera ──────────────────────────────────────────────────────────────────
const cam = new THREE.PerspectiveCamera(32, W / H, 2, 25000);
const span = Math.max(mastTopY, L);
if (VIEW === "sailing") {
  const d = 1.9 * span, az = THREE.MathUtils.degToRad(27), el = THREE.MathUtils.degToRad(5);
  cam.position.set(d * Math.cos(el) * Math.sin(az) + L * 0.05, mastTopY * 0.2 + d * Math.sin(el), d * Math.cos(el) * Math.cos(az));
  cam.lookAt(L * 0.03, mastTopY * 0.45, 0);
} else if (VIEW === "profile") {
  cam.position.set(L * 0.05, mastTopY * 0.14, span * 1.95);
  cam.lookAt(0, mastTopY * 0.45, 0);
} else if (VIEW === "anchored") {
  cam.fov = 34;
  cam.position.set(-L * 1.45, L * 0.2, L * 1.85);
  cam.lookAt(L * 0.08, L * 0.38, 0);
} else {
  cam.fov = 36;
  cam.position.set(-L * 0.55, L * 2.6, L * 1.15);
  cam.lookAt(0, 0, 0);
}
cam.updateProjectionMatrix();

// Point the sun's shadow at the boat.
sunLight.target.position.set(0, mastTopY * 0.3, 0);
scene.add(sunLight.target);

renderer.render(scene, cam);
renderer.render(scene, cam);

// Downsample the supersampled frame.
const out = document.createElement("canvas");
out.width = W;
out.height = H;
const ctx = out.getContext("2d");
ctx.imageSmoothingQuality = "high";
// A light grade, as a photographer would: a touch more colour and contrast.
ctx.filter = VIEW === "anchored" ? "saturate(1.35) contrast(1.08)" : "saturate(1.3) contrast(1.07)";
ctx.drawImage(renderer.domElement, 0, 0, W, H);
ctx.filter = "none";
// Honest label, in the image itself.
const label = "Computer render · not the actual yacht";
ctx.font = `500 ${Math.round(H * 0.019)}px system-ui, -apple-system, Segoe UI, sans-serif`;
const tw = ctx.measureText(label).width, pad = H * 0.012, bh = H * 0.034;
ctx.fillStyle = "rgba(0,0,0,0.32)";
ctx.fillRect(W - tw - pad * 3, H - bh - pad, tw + pad * 2, bh);
ctx.fillStyle = "rgba(255,255,255,0.92)";
ctx.textBaseline = "middle";
ctx.fillText(label, W - tw - pad * 2, H - pad - bh / 2);
window.result = out.toDataURL(q.get("fmt") === "png" ? "image/png" : "image/webp", 0.86);
window.scene = scene;
window.done = true;
