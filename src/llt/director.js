import * as THREE from 'three';
/* Director: el scroll (suavizado) decide ETAPA, cámara, corte, transparencias y TRD.
   El movimiento propio (jugo, lodo, partículas, rastras) corre solo con reloj real. */
import { app3d as ctx } from './clarificador.js';
import { cameraAt, stateAt, textAt, TEXTS, clamp } from './timeline.js';

const TAU = 0.45;      // segundos: suavizado del scroll (más alto = movimientos más suaves)
const OMEGA = 0.15;    // rad/s: giro propio de las rastras

function initDirector(Votes) {
  const $ = i => document.getElementById(i), hud = $('hud'), tt = $('t-title'), tl = $('t-line'), bar = $('bar-fill');
  const wp = new THREE.Vector3(); let shown = -2, lastAl = -1, T = 0;
  const readP = () => { const m = document.documentElement.scrollHeight - innerHeight; return m > 0 ? clamp(scrollY / m) : 0; };
  let ps = readP();
  function apply(dt) {
    dt = Math.min(dt, 0.05); T += dt;
    // Scroll libre: las votaciones reales están sincronizadas pero nunca bloquean la cámara.
    let tg = readP();
    ps += (tg - ps) * (1 - Math.exp(-dt / TAU)); if (Math.abs(tg - ps) < 1e-5) ps = tg;
    const p = ps, s = stateAt(p); Votes.tick(p);
    ctx.setOpen(s.open);
    ctx.trd.host.getWorldPosition(wp);
    const c = cameraAt(p, { fit: ctx.fitFor, open: s.open, trd: [wp.x, wp.y - .03, wp.z], mx: ctx.model.position.x, trdAz: ctx.trd.host.rotation.y - .5 });
    const V = ctx.V; V.tx = c.t[0]; V.ty = c.t[1]; V.tz = c.t[2]; V.az = c.az; V.el = c.el; V.zoom = c.d / ctx.fitD();
    ctx.pipeStreams.entry.set(s.entry, T); ctx.pipeStreams.clear.set(s.clear, T); ctx.pipeStreams.mud.set(s.mud, T);
    const ro = ctx.ring; ro.mesh.visible = s.open > .02; ro.mesh.material.opacity = .74 * clamp(s.open * 3); ro.tex.offset.x = -T * .05;
    Object.assign(ctx.SD, { S: T, dt, sp: s.sp, cl: s.cl });
    ctx.arms.rotation.y -= dt * OMEGA;
    ctx.trd.set(s.trd, T);
    bar.style.transform = `scaleX(${p})`;
    const t = textAt(p);
    if (t.i !== shown) { shown = t.i; if (t.i >= 0) { tt.textContent = TEXTS[t.i][2]; tl.textContent = TEXTS[t.i][3]; } }
    if (t.al !== lastAl) { lastAl = t.al; hud.style.opacity = t.al; }
  }
  ctx.hooks.push(apply); apply(0);
}

export { initDirector };
