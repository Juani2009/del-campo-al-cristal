/* Animación final + informe. Recibe las decisiones reales del clarificador LLT:
   - grupal: se confirman contra el estado del servidor de votaciones (misma sesión / epoch);
   - individual: elecciones locales guardadas al salir del 3D.
   La calidad visual sale de computeResults (rules.js) → calidad.js, sin evaluaciones nuevas. */
import { VARS, computeResults, fmtPct } from '../interactive/rules.js';
import { calidadDesdeResultados, categoria, claridadVisual, paletaAzucar, css, COLOR_MIN, COLOR_MAX } from '../interactive/calidad.js';
import { sugar } from '../interactive/results.js';
import { CLAVE } from '../interactive/continuar.js';
import './final.css';

const BASE = import.meta.env.BASE_URL, WEB = import.meta.env.MODE === 'web';
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const params = new URLSearchParams(location.search);
const modo = params.get('modo') === 'grupal' && !WEB ? 'grupal' : 'individual';
// Embebida: el clarificador 3D la prepara oculta en un iframe y la muestra con un fundido cuando está lista.
const EMBEBIDA = params.has('embebido') && window.parent !== window;
const avisar = tipo => { if (EMBEBIDA) try { window.parent.postMessage({ dcc: tipo }, location.origin); } catch {} };
if (EMBEBIDA) document.documentElement.classList.add('fin-embebida');
/* Ritmo de la animación: cristalización (T 30–60) a su velocidad original; el resto, un 23 % más breve. */
const RITMO = { desde: 30, hasta: 60, rampa: 2.5, factor: 1.3 };

function choicesValidos(ch) {
  return Array.isArray(ch) && ch.length === 4 && ch.every((o, i) => Number.isInteger(o) && o >= 0 && o < VARS[i].opts.length) ? ch : null;
}
function leerGuardado() { try { return JSON.parse(sessionStorage.getItem(CLAVE) || 'null'); } catch { return null; } }
function error(msg) {
  avisar('error');
  $('fin-velo').classList.add('fuera');
  const e = $('fin-error'); e.hidden = false;
  e.innerHTML = `<div><span class="fin-eyebrow">NO SE PUEDE MOSTRAR EL RESULTADO</span><p>${esc(msg)}</p><a target="_top" class="inf-btn" href="clarificador.html">Ir al clarificador LLT →</a> <a target="_top" class="inf-btn alt" href="./">Volver al inicio</a></div>`;
}
function cargar(src, tipo) {
  return new Promise((ok, mal) => {
    const el = tipo === 'css' ? Object.assign(document.createElement('link'), { rel: 'stylesheet', href: src }) : Object.assign(document.createElement('script'), { src });
    el.onload = ok; el.onerror = () => mal(new Error('No se pudo cargar ' + src)); document.head.appendChild(el);
  });
}

/* ---------- datos de la sesión ---------- */
async function datosGrupales() {
  const guardado = leerGuardado();
  const { io } = await import('socket.io-client');
  return new Promise(resolve => {
    const socket = io({ reconnection: false, timeout: 6000 });
    let estado = null, admin = null, listo = false;
    const fin = r => { if (listo) return; listo = true; socket.disconnect(); resolve(r); };
    const evaluar = () => {
      if (!estado) return;
      if (guardado?.modo === 'grupal' && guardado.epoch && guardado.epoch !== estado.epoch) return fin({ error: 'La sesión de votación cambió (se reinició) después de terminar el clarificador. Volvé a realizar la experiencia.' });
      const ch = choicesValidos(estado.choices);
      if (!ch) return fin({ error: 'El servidor todavía no tiene registradas las cuatro decisiones del grupo.' });
      // Con acceso de presentadora llega el conteo por opción; se espera un instante por él.
      setTimeout(() => fin({ choices: ch, estado: admin || estado }), admin ? 0 : 400);
    };
    socket.on('llt:state', s => { estado = s; evaluar(); });
    socket.on('llt:admin', s => { admin = s; if (estado) evaluar(); });
    socket.on('connect_error', () => fin({ error: 'No hay conexión con el servidor local de votaciones. Abrí esta página desde la computadora donde se ejecuta la experiencia.' }));
    setTimeout(() => fin({ error: 'El servidor de votaciones no respondió.' }), 8000);
  });
}
function datosIndividuales() {
  const g = leerGuardado();
  const url = choicesValidos((params.get('ch') || '').split(',').filter(Boolean).map(Number));
  const ch = choicesValidos(g?.modo === 'individual' ? g.choices : null) || url;
  return ch ? { choices: ch } : { error: 'No se encontraron las cuatro decisiones del clarificador. Realizá la simulación del LLT para ver tu azúcar.' };
}

/* ---------- informe ---------- */
const RESOL = {
  mayoria: 'Mayoría de votos',
  desempate_referencia: 'Empate · se eligió la opción empatada más cercana a la referencia',
  seleccion_manual_sin_votos: 'Sin votos · elegida por la presentadora',
};
function filaDecision(i, idx, st) {
  const v = VARS[i], o = v.opts[idx];
  let det = '';
  if (st) {
    const partes = [`<span class="inf-tag">${esc(RESOL[st.resolution] || 'Decisión registrada')}</span>`];
    if (st.resolution !== 'seleccion_manual_sin_votos') partes.push(`<span>${st.voted} de ${st.total} participantes votaron</span>`);
    if (st.resolution === 'desempate_referencia' && st.tied?.length) partes.push(`<span>Empataron: ${st.tied.map(j => esc(v.opts[j].l)).join(' y ')}</span>`);
    if (Array.isArray(st.counts)) partes.push(`<span>Votos: ${st.counts.map((n, j) => `${esc(v.opts[j].l)} = ${n}`).join(' · ')}</span>`);
    det = `<div class="inf-det">${partes.join('')}</div>`;
  }
  return `<li><div class="inf-dec-top"><span class="inf-num">ESTACIÓN ${i + 1}</span><strong>${esc(v.name)}: ${esc(o.l)}</strong></div><p>${esc(o.t)}</p>${det}</li>`;
}
function informe(ch, estado) {
  const r = computeResults(ch), q = calidadDesdeResultados(r), cat = categoria(q);
  $('inf-modo').textContent = estado ? 'EXPERIENCIA GRUPAL · INFORME FINAL' : 'SIMULACIÓN INDIVIDUAL · INFORME FINAL';
  $('inf-titulo').textContent = cat.nombre;
  $('inf-nueva').href = estado ? 'control.html' : 'clarificador.html?modo=individual';
  $('inf-nueva').textContent = estado ? 'Panel de la presentadora →' : 'Nueva simulación →';
  const factores = ch.map((o, i) => ({ i, o, c: VARS[i].opts[o].d[1] })).filter(x => x.c > 0).sort((a, b) => b.c - a.c);
  const frase = factores.length
    ? `El color aumentó sobre todo por ${factores.slice(0, 2).map(f => `${VARS[f.i].name === 'pH' ? 'pH' : VARS[f.i].name.toLowerCase()} ${VARS[f.i].opts[f.o].l}`).join(' y ')}.`
    : 'Todas las condiciones coincidieron con la referencia de menor color del simulador.';
  const pal = paletaAzucar(q);
  $('inf-cuerpo').innerHTML = `
  <div class="inf-hero">
    <div class="inf-azucar" style="--jugo:${css(pal.jugo)}">${sugar(r)}<span class="inf-cat inf-cat--${cat.id}">${esc(cat.nombre)}</span></div>
    <div class="inf-card">
      <h2>¿Por qué salió así?</h2>
      <p>${esc(cat.texto)} ${esc(frase)}</p>
      <div class="inf-escala" role="img" aria-label="Escala de color del azúcar: posición ${Math.round(claridadVisual(q) * 100)} de 100"><i style="left:${(2 + claridadVisual(q) * 96).toFixed(1)}%"></i><span>Oscura</span><span>Intermedia</span><span>Clara</span></div>
      <p class="inf-nota">La tonalidad se obtiene del índice de color calculado por el simulador (${r.color}/100), ubicado entre el menor (${COLOR_MIN}) y el mayor (${COLOR_MAX}) valor que permite el modelo. Es una simulación didáctica, no una medición industrial.</p>
    </div>
  </div>
  <h2 class="inf-h2">${estado ? 'Decisiones del grupo' : 'Tus decisiones'}</h2>
  <ol class="inf-decisiones">${ch.map((idx, i) => filaDecision(i, idx, estado?.stations?.[i])).join('')}</ol>
  <h2 class="inf-h2">Indicadores del clarificador (simulador)</h2>
  <div class="inf-metricas">
    <div><span>Claridad del jugo</span><strong>${r.claridad}/100</strong><small>índice ilustrativo</small></div>
    <div><span>Color</span><strong>${r.color}/100</strong><small>más alto = más oscuro</small></div>
    <div><span>Incrustaciones</span><strong>${r.incrust}/100</strong><small>índice de riesgo</small></div>
    <div><span>Merma total</span><strong>${fmtPct(r.merma)}</strong><small>incluye pérdida en lodos</small></div>
    <div><span>Pérdidas en lodos</span><strong>${fmtPct(r.perdidas)}</strong><small>parte de la merma total</small></div>
  </div>`;
}

/* ---------- animación ---------- */
async function iniciar() {
  const datos = modo === 'grupal' ? await datosGrupales() : datosIndividuales();
  if (datos.error) { error(datos.error); return; }
  const r = computeResults(datos.choices), q = calidadDesdeResultados(r);
  informe(datos.choices, modo === 'grupal' ? datos.estado : null);
  try { await Promise.all([cargar(BASE + 'maquinas/08-final.css', 'css'), cargar(BASE + 'maquinas/08-final.js')]); }
  catch (e) { error(e.message); return; }
  const mostrarInforme = () => { const s = $('informe'); s.hidden = false; requestAnimationFrame(() => s.classList.add('on')); $('fin-saltar').hidden = true; };
  let lista = false;
  const alEstarLista = () => {
    if (lista) return; lista = true; clearTimeout(espera);
    $('fin-velo').classList.add('fuera'); $('fin-saltar').hidden = false;
    avisar('listo');
  };
  let anim;
  try {
    anim = window.AzucarFinal.mount($('escena-final'), {
      resultado: q, desdeLLT: true, ritmo: RITMO, autoplay: !EMBEBIDA,
      onReady: alEstarLista,
      onEnd: () => setTimeout(mostrarInforme, 900),
    });
  } catch (e) { console.error(e); error('No se pudo iniciar la animación en este dispositivo.'); mostrarInforme(); return; }
  // Salida de emergencia: si la animación no avisa que está lista, nunca queda una pantalla lisa fija.
  const espera = setTimeout(() => { if (!lista) { alEstarLista(); anim.play(); } }, 15000);
  if (EMBEBIDA) addEventListener('message', ev => { if (ev.origin === location.origin && ev.data?.dcc === 'play') anim.play(); });
  $('fin-saltar').onclick = () => { anim.pause(); mostrarInforme(); };
  $('inf-repetir').onclick = () => { const s = $('informe'); s.classList.remove('on'); s.hidden = true; $('fin-saltar').hidden = false; anim.restart(); };
  window.__fin = anim;
}
iniciar();
