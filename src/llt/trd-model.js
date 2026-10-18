import * as THREE from 'three';
/**
 * trd-model.js v2 — TRD detallado del clarificador LLT, con jugo líquido continuo.
 * Marco local: origen en el centro del TRD, X radial, Y vertical, Z tangencial.
 * Paredes cerradas en ±X; caras abiertas en ±Z (el flujo sale por delante y por detrás).
 * Envolvente = placeholder del proyecto: caja 0.46×0.26×0.46, tubo r=0.1, placa en y=-0.2.
 */
const PI = Math.PI, clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), sm = e => e * e * (3 - 2 * e);
const FY = -0.178; // cara superior de la placa de impacto

function createTRD(opts = {}) {
  const { mats = {}, edgeColor = 0xc4c8cc, edgeOpacity = 0.3, impurities = true, particles = 70 } = opts;
  const IM = (c, o) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.62, metalness: 0.45, clearcoat: 0, envMapIntensity: 0.7, side: THREE.DoubleSide, ...o });
  const M = { body: mats.body || IM(0xc0692c, { roughness: 0.7 }), guide: mats.guide || IM(0xd98c4f, { roughness: 0.65 }),
    steel: mats.steel || IM(0x7d848b), cop: mats.cop || IM(0x9a5a38, { metalness: 0.6 }), dark: mats.dark || IM(0x23252a) };
  const pipeMat = M.steel.clone();
  const edgeMat = new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: edgeOpacity });
  const group = new THREE.Group(); group.name = 'TRD-detalle';
  const geoms = [];
  function add(geo, mat, x, y, z, parent, noEdges) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
    if (!noEdges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 35), edgeMat));
    (parent || group).add(m); geoms.push(geo); return m;
  }
  /* ---------- estructura ---------- */
  const shell = new THREE.Group(); shell.name = 'estructura'; group.add(shell);
  add(new THREE.BoxGeometry(0.46, 0.03, 0.46), M.body, 0, 0.135, 0, shell).name = 'tapa';
  add(new THREE.BoxGeometry(0.46, 0.04, 0.46), M.body, 0, -0.2, 0, shell).name = 'placa-impacto';
  const details = new THREE.Group(); details.name = 'detalles'; group.add(details);
  add(new THREE.CylinderGeometry(0.08, 0.08, 0.012, 24), M.cop, 0, FY + 0.001, 0, details, true).name = 'zona-impacto';
  const walls = [], guides = [];
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => add(new THREE.BoxGeometry(0.04, 0.1, 0.04), M.body, sx * 0.17, -0.15, sz * 0.17, shell, true))); // patas del placeholder
  [-1, 1].forEach(s => {
    const w = add(new THREE.BoxGeometry(0.03, 0.26, 0.46), M.body, s * 0.215, 0.02, 0, shell); w.name = 'pared-cerrada'; w.userData.sx = s; walls.push(w);
    const g = add(new THREE.BoxGeometry(0.025, 0.34, 0.16), M.guide, s * 0.128, 0.1, 0, shell); g.name = 'guia-tubo'; guides.push(g);
    [-1, 1].forEach(t => add(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), M.steel, s * 0.15, -0.03, t * 0.19, details, true).name = 'tirante');
  });
  for (let k = 0; k < 8; k++) { const a = k * PI / 4; add(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8), M.steel, 0.222 * Math.cos(a), 0.157, 0.222 * Math.sin(a), details, true); }
  /* ---------- tubo interno: de la tapa (+0.16) hasta la boquilla (-0.02) ---------- */
  const pipe = new THREE.Group(); pipe.name = 'tubo-interno'; group.add(pipe);
  add(new THREE.CylinderGeometry(0.1, 0.1, 0.18, 32, 1, true), pipeMat, 0, 0.07, 0, pipe, true).name = 'tubo';
  add(new THREE.TorusGeometry(0.1, 0.012, 8, 32), M.dark, 0, -0.02, 0, pipe, true).rotation.x = PI / 2;
  add(new THREE.TorusGeometry(0.106, 0.009, 8, 32), M.dark, 0, 0.15, 0, details, true).rotation.x = PI / 2;
  /* ---------- pieles de las caras abiertas ---------- */
  const skins = [1, -1].map(s => { const p = add(new THREE.BoxGeometry(0.46, 0.26, 0.012), M.body, 0, 0.02, s * 0.23, group); p.name = 'piel-' + (s > 0 ? 'frontal' : 'trasera'); p.userData.dir = s; return p; });

  /* ---------- jugo líquido continuo ---------- */
  let seed = 4711; const rnd = () => ((seed = Math.imul(seed, 1664525) + 1013904223 | 0) >>> 0) / 4294967296;
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const cx = cv.getContext('2d');
  cx.fillStyle = 'rgb(236,176,84)'; cx.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 90; i++) { cx.fillStyle = `rgba(255,${200 + (rnd() * 40 | 0)},${120 + (rnd() * 40 | 0)},${0.12 + rnd() * 0.3})`; cx.fillRect(rnd() * 64, rnd() * 256, 1 + rnd() * 3, 20 + rnd() * 90); }
  for (let i = 0; i < 40; i++) { cx.fillStyle = `rgba(150,90,30,${0.1 + rnd() * 0.2})`; cx.fillRect(rnd() * 64, rnd() * 256, 1 + rnd() * 2, 15 + rnd() * 60); }
  const jetTex = new THREE.CanvasTexture(cv); jetTex.wrapS = jetTex.wrapT = THREE.RepeatWrapping; jetTex.colorSpace = THREE.SRGBColorSpace;
  const sheetTex = jetTex.clone(); sheetTex.needsUpdate = true;
  const LM = (map, op) => new THREE.MeshPhysicalMaterial({ color: 0xffffff, map, transparent: true, opacity: op, roughness: 0.16, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.15, envMapIntensity: 1.1, side: THREE.DoubleSide, depthWrite: false });
  const BASE = { jet: 0.55, sheet: 0.5, disc: 0.55 };
  const jetMat = LM(jetTex, BASE.jet), sheetMat = LM(sheetTex, BASE.sheet), discMat = LM(null, BASE.disc);
  discMat.color.set(0xd69a45);
  const liquid = new THREE.Group(); liquid.name = 'jugo'; group.add(liquid);
  const lm = (g, mat, y, ro) => { const m = new THREE.Mesh(g, mat); m.position.y = y; m.renderOrder = ro; liquid.add(m); geoms.push(g); return m; };
  const jetUp = lm(new THREE.CylinderGeometry(0.086, 0.086, 0.58, 28, 1, true), jetMat, 0.29 - 0.02 + 0.0, 6);     // columna dentro del tubo: -0.02 → 0.56
  jetUp.scale.set(0.97, 1, 0.97);
  const jetFree = lm(new THREE.CylinderGeometry(0.086, 0.066, 0.16, 28, 1, true), jetMat, -0.1, 6);              // chorro libre hasta la placa
  const disc = lm(new THREE.CylinderGeometry(0.115, 0.14, 0.02, 40), discMat, FY + 0.01, 6);                      // charco bajo el impacto
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd49b, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide });
  const ring = lm(new THREE.TorusGeometry(0.1, 0.006, 6, 48), ringMat, FY + 0.022, 8); ring.rotation.x = PI / 2;

  const NZ = 24, NX = 10, Z1 = 0.85, ZB = 0.23;
  const halfW = z => z < ZB ? 0.2 : 0.2 + (z - ZB) * 0.7, floorY = z => z < ZB ? FY : FY - (z - ZB) * (z - ZB) * 0.9, thick = z => 0.05 * (1 - 0.7 * z / Z1) + 0.008;
  const sheets = [1, -1].map(s => {
    const n = (NZ + 1) * (NX + 1), uv = new Float32Array(n * 2), idx = [];
    for (let i = 0; i <= NZ; i++) for (let k = 0; k <= NX; k++) { const q = i * (NX + 1) + k; uv[q * 2] = k / NX; uv[q * 2 + 1] = i / NZ * 2; if (i < NZ && k < NX) { const c = q + NX + 1; idx.push(q, c, q + 1, q + 1, c, c + 1); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); geoms.push(g);
    const m = new THREE.Mesh(g, sheetMat); m.renderOrder = 7; m.frustumCulled = false; m.userData.s = s; liquid.add(m); return m;
  });
  function fillSheet(m, t, j) {
    const p = m.geometry.attributes.position, s = m.userData.s;
    for (let i = 0; i <= NZ; i++) { const z = i / NZ * Z1, w = halfW(z);
      for (let k = 0; k <= NX; k++) { const x = (k / NX * 2 - 1) * w, e = (x / w) * (x / w);
        p.setXYZ(i * (NX + 1) + k, x, floorY(z) + thick(z) * (1 - 0.75 * e) + j * 0.012 * Math.sin(z * 38 - t * 9 + x * 25) * (0.3 + z / Z1), s * z); } }
    p.needsUpdate = true; m.geometry.computeVertexNormals();
  }

  /* ---------- impurezas arrastradas por el jugo ---------- */
  const sc = document.createElement('canvas'); sc.width = sc.height = 64; const sx = sc.getContext('2d'), gr = sx.createRadialGradient(32, 32, 2, 32, 32, 31);
  [[0, 1], [0.35, 0.94], [0.8, 0.28], [1, 0]].forEach(s => gr.addColorStop(s[0], `rgba(255,255,255,${s[1]})`)); sx.fillStyle = gr; sx.fillRect(0, 0, 64, 64);
  const sprite = new THREE.CanvasTexture(sc); sprite.colorSpace = THREE.SRGBColorSpace;
  const systems = [];
  if (impurities) [[particles, 0.03, 0x4a2c18, 0.85], [Math.round(particles / 5), 0.07, 0xdbb77e, 0.8]].forEach(c => {
    const arr = new Float32Array(c[0] * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(arr, 3).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.PointsMaterial({ map: sprite, color: c[2], size: c[1], transparent: true, opacity: c[3], depthWrite: false, alphaTest: 0.04 });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 9; liquid.add(pts);
    systems.push({ pts, arr, geo, mat, ps: Array.from({ length: c[0] }, () => ({ u: rnd(), s: rnd() < 0.5 ? -1 : 1, x: rnd() - 0.5, ph: rnd() * 100, v: 0.1 + rnd() * 0.05 })) });
  });

  /* ---------- API ---------- */
  let calm = 0.6, flow = 1, t = 0, reveal = 0, wallsP = 0;
  function vis() { liquid.visible = flow > 0.01 && (reveal > 0.02 || wallsP > 0.02); sheets.forEach(m => m.visible = reveal > 0.02); }
  /** 0 = piel cerrada (idéntico al placeholder), 1 = caras abiertas. */
  function setReveal(p) { reveal = clamp(p); const e = sm(reveal); details.visible = reveal > 0.02; guides.forEach(g => { g.scale.y = Math.max(e, 0.001); g.position.y = -0.07 + 0.17 * e; }); skins.forEach(s => { s.position.z = s.userData.dir * (0.23 + e * 0.55); s.visible = reveal < 0.999; }); vis(); }
  /** 0 = paredes cerradas, 1 = paredes laterales desplazadas para ver el interior. */
  function setWalls(p) { wallsP = clamp(p); const e = sm(wallsP); walls.forEach(w => w.position.x = w.userData.sx * (0.215 + e * 0.75)); guides.forEach(g => g.position.x = Math.sign(g.position.x) * (0.128 + e * 0.75)); vis(); }
  /** 0 = flujo ordenado (con TRD), 1 = flujo agitado. */
  function setCalm(v) { calm = clamp(v); }
  /** Caudal 0..1. */
  function setFlow(v) { flow = clamp(v); const k = clamp(flow * 1.3); jetMat.opacity = BASE.jet * k; sheetMat.opacity = BASE.sheet * k; discMat.opacity = BASE.disc * k; vis(); }
  function setPipeGhost(v) { const a = +v || 0, tr = a > 0; if (pipeMat.transparent !== tr) { pipeMat.transparent = tr; pipeMat.depthWrite = !tr; pipeMat.needsUpdate = true; } pipeMat.opacity = 1 - 0.75 * a; }
  function update(dt) {
    t += dt; const j = calm, f = 1;
    jetTex.offset.y += dt * 1.8 * f; sheetTex.offset.y -= dt * 1.2 * f;
    const wob = 1 + j * 0.08 * Math.sin(t * 19); jetFree.scale.set(wob, 1, wob);
    const w = (t * 0.9) % 1; ring.scale.setScalar(0.8 + w * 1.1); ringMat.opacity = 0.45 * (1 - w) * flow; disc.scale.set(1 + 0.04 * j * Math.sin(t * 13), 1, 1 + 0.04 * j * Math.cos(t * 11));
    if (liquid.visible) sheets.forEach(m => { if (m.visible) fillSheet(m, t, j); });
    systems.forEach(S => { for (let i = 0; i < S.ps.length; i++) { const q = S.ps[i]; q.u = ((q.u + dt * q.v * f) % 1 + 1) % 1; const u = q.u; let x, y, z, n;
      if (u < 0.45) { const a = u / 0.45; x = 0; y = 0.45 - a * 0.63; z = 0; n = 0.012 * j * a; }
      else { const a = (u - 0.45) / 0.55; x = q.x * (0.3 + 0.5 * a); y = FY + 0.02 + 0.03 * Math.sin(a * 3) - a * a * 0.4; z = q.s * (0.08 + a * 0.8); n = 0.05 * j * (1 - a * 0.6); }
      const s = t * 7 + q.ph; S.arr[i * 3] = x + n * Math.sin(s * 1.7); S.arr[i * 3 + 1] = y + n * 0.5 * Math.sin(s * 2.3); S.arr[i * 3 + 2] = z + n * Math.sin(s * 1.3); }
      S.geo.attributes.position.needsUpdate = true; });
  }
  function dispose() { geoms.forEach(g => g.dispose()); edgeMat.dispose(); pipeMat.dispose(); [jetMat, sheetMat, discMat, ringMat].forEach(m => m.dispose()); [jetTex, sheetTex, sprite].forEach(x => x.dispose()); systems.forEach(S => { S.geo.dispose(); S.mat.dispose(); }); }
  setReveal(0); setFlow(1);
  return { group, parts: { shell, pipe, skins, walls, liquid }, materials: M, setReveal, setWalls, setCalm, setFlow, setPipeGhost, update, dispose };
}

export { createTRD };
