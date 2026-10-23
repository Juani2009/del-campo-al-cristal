/* LLT interactivo · núcleo de reglas. Fuente: Especificación de interactividad LLT v1.
   SIMULACIÓN DIDÁCTICA: los valores son hipotéticos, no mediciones ni predicciones de una fábrica. */
// d = [Δ claridad, Δ color, Δ incrustaciones, Δ merma (centésimas de punto %), Δ pérdidas (centésimas de punto %)]
export const VARS = [
  { id: 'ph', name: 'pH', ref: 1, q: '¿Con qué pH entra el jugo acondicionado?', sci: 'La cal neutraliza los ácidos del jugo y ayuda a que los coloides se junten; un pH demasiado bajo o alto trae riesgos químicos.',
    opts: [{ l: '6,8', t: 'Menor neutralización; puede aumentar la turbidez y el riesgo de inversión de sacarosa.', d: [-12, 7, 2, 50, 40] },
           { l: '7,2', t: 'Buen equilibrio químico para el caso simulado.', d: [0, 0, 0, 0, 0] },
           { l: '7,8', t: 'Mayor alcalinidad; posible aumento del color y riesgo de incrustaciones.', d: [-3, 10, 27, 25, 10] }] },
  { id: 'temp', name: 'Temperatura', ref: 2, q: '¿A qué temperatura se calienta el jugo?', sci: 'El calor desestabiliza las partículas suspendidas y facilita que formen agregados.',
    opts: [{ l: '95 °C', t: 'Calentamiento menos intenso; separación menos favorable en el modelo.', d: [-9, 3, 2, 35, 25] },
           { l: '100 °C', t: 'Calentamiento adecuado, aunque algo inferior al punto de referencia.', d: [-4, 1, 0, 15, 8] },
           { l: '105 °C', t: 'Calentamiento favorable para la coagulación en este caso didáctico.', d: [0, 0, 0, 0, 0] }] },
  { id: 'floc', name: 'Floculante', ref: 1, q: '¿Qué dosis de floculante se agrega?', sci: 'Las cadenas del polímero unen partículas finas en flóculos que sedimentan más rápido.',
    opts: [{ l: '1 ppm', t: 'Dosificación insuficiente; quedan más partículas finas suspendidas.', d: [-16, 3, 0, 60, 45] },
           { l: '3 ppm', t: 'Formación y sedimentación favorables de flóculos.', d: [0, 0, 0, 0, 0] },
           { l: '6 ppm', t: 'Sobredosificación respecto del caso elegido; más costo y menor eficiencia modelada.', d: [-5, 2, 3, 20, 12] }] },
  { id: 'caud', name: 'Caudal', ref: 1, q: '¿Con qué caudal se alimenta el LLT?', sci: 'Más caudal reduce el tiempo de residencia y puede arrastrar sólidos hacia la salida.',
    opts: [{ l: '70 %', t: 'Más tiempo de residencia, pero menor producción por hora.', d: [2, 4, 3, 30, 10] },
           { l: '100 %', t: 'Alimentación estable al caudal de referencia.', d: [0, 0, 0, 0, 0] },
           { l: '130 %', t: 'Menor tiempo de residencia y mayor arrastre de sólidos.', d: [-19, 6, 2, 80, 55] }] },
];
export const REF = { claridad: 93, color: 18, incrust: 10, merma: 100, perdidas: 35 };   // merma y pérdidas en centésimas de %
export const clamp = x => Math.min(100, Math.max(0, x));

/** choices: 4 índices de opción (0-2), uno por variable. Suma lineal documentada; pérdidas en lodos YA forman parte de la merma. */
export function computeResults(ch) {
  const t = [0, 0, 0, 0, 0]; ch.forEach((o, i) => VARS[i].opts[o].d.forEach((x, k) => t[k] += x));
  return { claridad: clamp(REF.claridad + t[0]), color: clamp(REF.color + t[1]), incrust: clamp(REF.incrust + t[2]),
           merma: (REF.merma + t[3]) / 100, perdidas: (REF.perdidas + t[4]) / 100 };
}
export const fmtPct = n => n.toFixed(2).replace('.', ',') + ' %';

/** Valores que más adelante pueden recibir las animaciones de evaporación, cristalización, centrifugación y secado. */
export const animationParams = r => ({ turbidez: 100 - r.claridad, color: r.color, incrustaciones: r.incrust, perdidasPct: r.perdidas, mermaPct: r.merma });

/** Conclusión automática: por variable, solo qué indicadores empeoran/mejoran respecto de la referencia (sin pesos inventados). */
export function conclusion(ch) {
  const N = ['claridad', 'color', 'incrustaciones', 'merma', 'pérdidas'], good = [], bad = [];
  ch.forEach((o, i) => { const d = VARS[i].opts[o].d, w = [], b = [];
    d.forEach((x, k) => { if (x === 0) return; const peor = k === 0 ? x < 0 : x > 0; (peor ? w : b).push(N[k]); });
    if (!w.length && !b.length) good.push(`${VARS[i].name} ${VARS[i].opts[o].l}`);
    else if (w.length) bad.push(`${VARS[i].name} ${VARS[i].opts[o].l} (${w.join(', ')})`); });
  return (good.length ? 'Sin penalización: ' + good.join(', ') + '. ' : '') + (bad.length ? 'Perjudicaron: ' + bad.join('; ') + '.' : 'Ninguna decisión perjudicó el proceso simulado.');
}

/* ---------- sesión grupal: registro → todos votan en cada estación → estaciones SECUENCIALES (mismo código en servidor y demo) ---------- */
export const HOST_ACTIONS = ['start', 'begin', 'close', 'tiebreak', 'useref', 'results', 'reset'];
const fresh = () => VARS.map(() => ({ began: false, open: false, rounds: [{}], allowed: [0, 1, 2], res: null }));
export const newState = code => ({ code, stage: 'lobby', order: [], parts: {}, st: fresh() });   // stage: lobby | running | results
/** Votantes por estación: sin grupos, cada estación la votan todos los participantes registrados. */
export const groupCounts = s => { const n = s.stage === 'lobby' ? 0 : s.order.length; return [n, n, n, n]; };
const cur = st => st.rounds[st.rounds.length - 1];
export const tally = st => { const c = [0, 0, 0]; Object.values(cur(st)).forEach(o => c[o]++); return c; };
export const votesIn = st => Object.keys(cur(st)).length;
export function resolve(st) {
  const c = tally(st), m = Math.max(...c); if (!m) return { k: 'empty' };
  const w = c.map((x, i) => x === m ? i : -1).filter(i => i >= 0); return w.length === 1 ? { k: 'winner', idx: w[0] } : { k: 'tie', tied: w };
}
export const decided = x => x.res && (x.res.k === 'winner' || x.res.k === 'ref');
export const choicesOf = s => s.st.every(decided) ? s.st.map(x => x.res.idx) : null;
export const nextStation = s => s.st.findIndex(x => !x.began);   // -1 si ya comenzaron todas

export function reduce(s, a) {   // devuelve { ok } | { ok:false, err }
  const no = err => ({ ok: false, err }), yes = { ok: true };
  switch (a.t) {
    case 'join': if (!a.pid) return no('Falta identificador');
      if (!s.parts[a.pid]) { s.parts[a.pid] = {}; s.order.push(a.pid); }   // quien llega tarde también vota en las estaciones que faltan
      return yes;   // volver a entrar conserva los votos
    case 'start': if (s.stage !== 'lobby') return no('Ya comenzó'); if (!s.order.length) return no('Sin participantes');
      s.stage = 'running'; return yes;
    case 'begin': { if (s.stage !== 'running') return no('La sesión no comenzó'); const i = a.i ?? nextStation(s);
      if (i < 0 || i > 3 || s.st[i].began) return no('Estación no disponible'); if (!s.st.slice(0, i).every(decided)) return no('Primero debe decidirse la estación anterior');
      const st = s.st[i]; st.began = true; if (groupCounts(s)[i] === 0) st.res = { k: 'empty' }; else st.open = true; return yes; }
    case 'vote': { if (!s.parts[a.pid]) return no('No estás registrado'); const i = a.i ?? s.st.findIndex(x => x.open), st = s.st[i];
      if (s.stage !== 'running' || !st || !st.open) return no('No hay una votación abierta ahora'); if (!st.allowed.includes(a.opt)) return no('Opción no permitida');
      if (a.pid in cur(st)) return no('Ya votaste'); cur(st)[a.pid] = a.opt;
      if (votesIn(st) >= groupCounts(s)[i]) { st.open = false; st.res = resolve(st); }   // votaron todos los participantes registrados → se cierra
      return yes; }
    case 'close': s.st.forEach(x => { if (x.open) { x.open = false; x.res = resolve(x); } }); return yes;   // la presentadora cierra con los votos recibidos
    case 'tiebreak': s.st.forEach(x => { if (x.res && x.res.k === 'tie') { x.allowed = x.res.tied; x.rounds.push({}); x.open = true; x.res = null; } }); return yes;
    case 'useref': s.st.forEach((x, i) => { if (x.res && x.res.k === 'empty') x.res = { k: 'ref', idx: VARS[i].ref }; }); return yes;   // autorización explícita
    case 'results': if (!choicesOf(s)) return no('Faltan decisiones'); s.stage = 'results'; return yes;
    case 'reset': s.stage = 'lobby'; s.st = fresh(); return yes;   // los participantes siguen registrados
  } return no('Acción desconocida');
}
export function pub(s, pid) {
  const me = s.parts[pid];
  return { code: s.code, stage: s.stage, n: s.order.length, gc: groupCounts(s), me: me ? {} : null, my: s.st.map(x => cur(x)[pid]), next: nextStation(s),
    st: s.st.map(x => ({ began: x.began, open: x.open, round: x.rounds.length, allowed: x.allowed, counts: tally(x), voted: votesIn(x), res: x.res })), ch: choicesOf(s) };
}
