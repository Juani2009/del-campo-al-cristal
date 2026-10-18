/* TRD detallado EN SU LUGAR: sustituye al placeholder con la misma silueta cerrada.
   Todo su estado (caras, paredes, tubo transparente, flujo) lo fija el director desde el scroll. */
import { app3d as ctx } from './clarificador.js';
import { createTRD } from './trd-model.js';

function initTRDDetail({ index = 7 } = {}) {
  const host = ctx.interior.getObjectByName('TRD-' + (index + 1));
  if (!host) throw new Error('Falta el soporte TRD-' + (index + 1));
  const trd = createTRD({ mats: { body: ctx.mats.trdM, steel: ctx.mats.stlI, cop: ctx.mats.cop, dark: ctx.mats.dk } });
  host.children.forEach(c => c.visible = false);   // el detalle cerrado reemplaza la caja del placeholder
  host.add(trd.group); trd.setCalm(0.72); trd.setFlow(0); let last = 0;
  ctx.trd = { host, detail: trd, set(s, S) { trd.setReveal(s.reveal); trd.setWalls(s.walls); trd.setPipeGhost(s.ghost); trd.setFlow(s.flow); trd.update(S - last); last = S; } };
  return ctx.trd;
}

export { initTRDDetail };
