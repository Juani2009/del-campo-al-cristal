import * as THREE from 'three';
/**
 * Ventanas didácticas de flujo continuo para las tres tuberías.
 * No resuelve dinámica de fluidos; el mapa desplazado ofrece lectura visual
 * del recorrido del líquido (no reemplaza la sedimentación real).
 */
import { app3d as ctx } from './clarificador.js';

const GL = new THREE.Color(0x8da5ac);
const PI = Math.PI;
const DEG = PI / 180;
const P = (r, deg, y) => new THREE.Vector3(r * Math.cos(deg * DEG), y, -r * Math.sin(deg * DEG));

function juiceTexture(base, streak, fleck) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  const col = v => '#' + v.toString(16).padStart(6, '0');
  const grd = g.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, col(base)); grd.addColorStop(.25, col(streak));
  grd.addColorStop(.52, col(base)); grd.addColorStop(.82, col(base));
  grd.addColorStop(1, col(streak));
  g.fillStyle = grd; g.fillRect(0, 0, 512, 128);
  // Hilos longitudinales: la textura desplaza volumen, no solamente puntos.
  let seed = 71231; const rnd = () => ((seed = Math.imul(seed, 1664525) + 1013904223 | 0) >>> 0) / 4294967296;
  for (let i = 0; i < 125; i++) {
    const y = rnd() * 128, x = rnd() * 512;
    g.fillStyle = `rgba(255,245,198,${(0.035 + rnd() * .28).toFixed(3)})`;
    g.fillRect(x, y, 16 + rnd() * 152, .5 + rnd() * 2.0);
  }
  // Franjas que viajan por el eje del tubo al desplazar UV: movimiento visible de jugo continuo.
  for (let i = 0; i < 22; i++) {
    const x = rnd() * 512, width = 9 + rnd() * 27;
    const b = g.createLinearGradient(x - width, 0, x + width, 0);
    b.addColorStop(0, 'rgba(255,239,192,0)');
    b.addColorStop(.5, `rgba(255,239,192,${(.10 + rnd() * .26).toFixed(3)})`);
    b.addColorStop(1, 'rgba(255,239,192,0)');
    g.fillStyle = b; g.fillRect(x-width,0,width*2,128);
  }
  for (let i = 0; i < 65; i++) {
    g.fillStyle = col(fleck); g.globalAlpha = .08 + rnd() * .2;
    g.beginPath(); g.ellipse(rnd() * 512, rnd() * 128, .8 + rnd() * 3.0, .6 + rnd() * 1.4, 0, 0, PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  const tx = new THREE.CanvasTexture(c);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.repeat.set(3, 1);
  tx.anisotropy = 4;
  return tx;
}

function makeChannel({ points, radius, base, streak, fleck, opacity, speed, shell, name }) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.03);
  const geo = new THREE.TubeGeometry(curve, 96, radius, 22, false);
  const tex = juiceTexture(base, streak, fleck);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, map: tex, metalness: 0, roughness: .19, clearcoat: .65,
    clearcoatRoughness: .14, transparent: true, opacity, side: THREE.DoubleSide,
    depthWrite: false, emissive: base, emissiveIntensity: .07,
  });
  const fluid = new THREE.Mesh(geo, mat);
  fluid.name = name + '-jugo-continuo'; fluid.renderOrder = 10;
  const group = new THREE.Group(); group.name = name + '-visual';
  ctx.interior.add(group); group.add(fluid);
  // Dos bordes longitudinales iluminados ayudan a leer el flujo sobre fondo oscuro.
  const highlights = [];
  for (const phi of [-1.1, 1.6]) {
    const verts = [];
    for (let i = 0; i <= 90; i++) {
      const u = i / 90, pos = curve.getPointAt(u), t = curve.getTangentAt(u);
      const a = new THREE.Vector3(0, 1, 0);
      if (Math.abs(t.dot(a)) > .95) a.set(1, 0, 0);
      const side = new THREE.Vector3().crossVectors(t, a).normalize();
      const up = new THREE.Vector3().crossVectors(t, side).normalize();
      verts.push(pos.addScaledVector(side, radius * Math.cos(phi)).addScaledVector(up, radius * Math.sin(phi)));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(verts),
      new THREE.LineBasicMaterial({ color: streak, opacity: .3, transparent: true, depthWrite: false }));
    line.renderOrder = 12; highlights.push(line); group.add(line);
  }
  // Material propio de la tubería para no transparentar todas las demás piezas.
  const shellSolid = shell.material;
  const shellGlass = shellSolid.clone();
  shellGlass.color.set(0x8da5ac); shellGlass.metalness = .12;
  shellGlass.roughness = .12; shellGlass.transparent = true;
  shellGlass.opacity = .16; shellGlass.depthWrite = false;
  return {
    name, group, fluid, shell, shellSolid, shellGlass, tex, speed,
    set(a, S) {   // a: 0 = tubería sólida, 1 = transparente; S: progreso de flujo (reversible)
      const on = a > .001; group.visible = on;
      shell.material = on ? shellGlass : shellSolid;
      shellGlass.opacity = 1 - .84 * a; shellGlass.depthWrite = a < .02;
      shellGlass.color.copy(shellSolid.color).lerp(GL, a);
      shellGlass.metalness = shellSolid.metalness + (.12 - shellSolid.metalness) * a;
      shellGlass.roughness = shellSolid.roughness + (.12 - shellSolid.roughness) * a;
      tex.offset.x = -(S * speed) % 1;
      mat.opacity = opacity * Math.min(1, a * 1.6) * (.93 + .07 * Math.sin(S * 2.6));
    },
  };
}

function initPipeFlow() {
  const feedShell = ctx.dist.getObjectByName('entrada-jugo-mezclado');
  const clearShell = ctx.take.getObjectByName('salida-jugo-claro');
  const mudShell = ctx.conn.getObjectByName('tuberia-descarga-lodos');
  if (!feedShell || !clearShell || !mudShell) throw new Error('No se encontraron las tres tuberías del modelo LLT');
  const streams = {
    entry: makeChannel({
      points: [P(4.29,150,2.52),P(3.1,150,2.52),P(2.12,150,2.52)], radius: .093,
      base: 0xb77a34, streak: 0xffd58a, fleck: 0x4d301b, opacity: .91, speed: .42, shell: feedShell, name: 'entrada',
    }),
    clear: makeChannel({
      points: [P(1.22,15,2.0),P(2.9,15,2.0),P(4.29,15,2.0)], radius: .084,
      base: 0xd2a55d, streak: 0xffe7aa, fleck: 0x927c52, opacity: .85, speed: .36, shell: clearShell, name: 'salida-clara',
    }),
    mud: makeChannel({
      points: [new THREE.Vector3(0,-2.50,0),new THREE.Vector3(0,-3.0,0),new THREE.Vector3(0,-3.8,0),new THREE.Vector3(0,-4.06,0)],
      radius: .112, base: 0x704127, streak: 0xd49a5e, fleck: 0x25160f, opacity: .96, speed: .24,
      shell: mudShell, name: 'descarga-lodos',
    }),
  };
  // Anillo interior de unión. Se ilumina cuando el líquido llega al anillo distribuidor.
  const ringTex = juiceTexture(0xb77a34, 0xffd58a, 0x50301d);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.22,.08,14,100),
    new THREE.MeshPhysicalMaterial({map:ringTex,color:0xffffff,transparent:true,opacity:.74,roughness:.2,depthWrite:false,side:THREE.DoubleSide}));
  ring.rotation.x = PI/2; ring.position.y = 2.52; ring.renderOrder=10; ring.name='jugo-en-anillo-distribuidor';
  ctx.interior.add(ring);

  ctx.pipeStreams = streams; ctx.ring = { mesh: ring, tex: ringTex };
  return streams;
}

export { initPipeFlow };
