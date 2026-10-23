/* Recorrido industrial 2D · distribución, navegación y tarjeta giratoria del modelo
   originales/recorrido_azucar_demo.html, con las máquinas animadas originales (public/maquinas). */
import { ETAPAS } from './etapas.js';   // etapas.js conserva también FUENTES, como respaldo (no se muestran)
import { VARS } from '../interactive/rules.js';
import './proceso.css';
import { irConFundido } from '../interactive/fundido.js';

const BASE = import.meta.env.BASE_URL, WEB = import.meta.env.MODE === 'web';
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N = ETAPAS.length;
const proceso = $('proceso'), fin = $('siguiente'), flipper = $('rc-flipper'), front = $('rc-front'), back = $('rc-back');
const ill = $('rc-ill'), host = $('rc-host');
let index = 0, anim = null, girada = false, pausadaPorUsuario = false, token = 0;

if (WEB) document.querySelectorAll('[data-modo="grupal"]').forEach(a => a.remove());

/* ---------- carga diferida de las máquinas (scripts clásicos que definen window.XxxAnimado) ---------- */
const cargas = {};
function cargar(archivo) {
  return cargas[archivo] ||= new Promise((ok, mal) => {
    const s = document.createElement('script'); s.src = BASE + 'maquinas/' + archivo;
    s.onload = ok; s.onerror = () => { delete cargas[archivo]; mal(new Error('No se pudo cargar ' + archivo)); };
    document.head.appendChild(s);
  });
}
function precargar(i) {
  if (i < 0 || i >= N) return;
  const href = BASE + 'maquinas/' + ETAPAS[i].maquina.archivo;
  if (document.querySelector(`link[rel=prefetch][href="${href}"]`)) return;
  document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'prefetch', href }));
}

/* La máquina ocupa el mayor tamaño posible dentro del panel sin deformarse (encaje «contain»). */
function encajar() {
  const m = ETAPAS[index].maquina, W = ill.clientWidth, H = ill.clientHeight;
  if (!W || !H) return;
  let w = Math.min(W, H * m.w / m.h);
  if (m.recorte && w < m.recorte.debajo) w = Math.min(W, H * m.recorte.w / m.h);
  host.style.width = Math.floor(w) + 'px';
}
new ResizeObserver(encajar).observe(ill);

async function montar(i) {
  const my = ++token, e = ETAPAS[i];
  if (anim) { try { anim.destroy(); } catch {} anim = null; }
  host.innerHTML = ''; host.className = 'rc-host'; $('rc-cargando').hidden = false; $('rc-cargando').textContent = 'Cargando máquina…';
  encajar();
  try { await cargar(e.maquina.archivo); } catch (err) { if (my === token) $('rc-cargando').textContent = 'No se pudo cargar la animación. Revisá la conexión y volvé a intentar.'; return; }
  if (my !== token) return;
  anim = window[e.maquina.global].mount(host);
  $('rc-cargando').hidden = true;
  if (girada) anim.pause();
  precargar(i + 1);
}

/* ---------- tarjeta giratoria ---------- */
function botonPausa() { return host.querySelector('button[class$="__btn"]'); }
function girar(v) {
  girada = v;
  flipper.classList.toggle('flipped', v);
  front.inert = v; back.inert = !v;
  front.setAttribute('aria-hidden', String(v)); back.setAttribute('aria-hidden', String(!v));
  $('rc-flip').textContent = v ? '↶ Volver a la máquina' : 'Ver parte química ↻';
  $('rc-flip').setAttribute('aria-expanded', String(v));
  if (anim) {
    if (v) { pausadaPorUsuario = botonPausa()?.getAttribute('aria-label') === 'Reanudar animación'; anim.pause(); }
    else if (!pausadaPorUsuario) anim.play();
  }
  if (v) back.scrollTop = 0;
}

/* ---------- ficha química (dorso) ---------- */
const ORIGEN = {
  industrial: ['🏭', 'Rango industrial orientativo', 'Valor típico de bibliografía; varía según la planta, la caña y el esquema de proceso.'],
  simulador: ['🎮', 'Condición del simulador', 'Estimación didáctica del clarificador LLT, no una medición de planta.'],
  cualitativo: ['↗', 'Tendencia', 'Se explica el efecto sin una cifra universal.'],
};
const TIPO = { fisico: 'Fenómeno físico', quimico: 'Reacción química', biologico: 'Proceso biológico' };
const PART = { agua: 'H₂O', sacarosa: 'Sac', imp: 'Imp', fibra: 'Fib', ca: 'Ca²⁺', floc: 'Flóc', vapor: 'Vap', cristal: '', miel: 'Miel', aire: 'Aire' };
const LEYENDA = { agua: 'agua', sacarosa: 'sacarosa disuelta', imp: 'impurezas', fibra: 'fibra', ca: 'iones calcio', floc: 'flóculos', vapor: 'vapor de agua', cristal: 'cristal de sacarosa', miel: 'miel', aire: 'aire' };
const badge = o => { const [ic, nom, tit] = ORIGEN[o]; return `<span class="rc-origen rc-origen--${o}" title="${esc(tit)}">${ic} ${esc(nom)}</span>`; };

function seccion(titulo, html, abierta = false) { return `<details class="rc-sec"${abierta ? ' open' : ''}><summary>${esc(titulo)}</summary><div class="rc-sec-in">${html}</div></details>`; }
function fichaQuimica(e) {
  const q = e.quimica, tipos = [...new Set(q.particulas)];
  const flujos = `<div class="rc-flujos"><div><span class="rc-mini">ENTRA</span><ul>${q.entra.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><span class="rc-flecha" aria-hidden="true">→</span><div><span class="rc-mini">SALE</span><ul>${q.sale.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>` +
    (q.composicion ? `<div class="rc-point"><strong>${esc(q.composicion.texto)}:</strong> ${esc(q.composicion.valor)} ${badge(q.composicion.origen)}</div>` : '');
  const ocurre = q.ocurre.map(o => `<div class="rc-point"><span class="rc-tipo rc-tipo--${o.tipo}">${TIPO[o.tipo]}</span><strong>${esc(o.titulo)}.</strong> ${esc(o.texto)}${o.ecuacion ? `<div class="rc-ecuacion">${esc(o.ecuacion)}</div>` : ''}</div>`).join('');
  const aditivos = q.aditivos.ninguno ? `<div class="rc-point">${esc(q.aditivos.ninguno)}</div>` :
    q.aditivos.lista.map(a => `<div class="rc-point"><strong>${esc(a.nombre)}</strong><dl><dt>Para qué</dt><dd>${esc(a.para)}</dd><dt>Cómo actúa</dt><dd>${esc(a.como)}</dd><dt>Si falta o sobra</dt><dd>${esc(a.limite)}</dd></dl></div>`).join('');
  const cond = q.condiciones.map(c => `<div class="rc-point"><div class="rc-cond-top"><strong>${esc(c.variable)}</strong>${badge(c.origen)}</div><div class="rc-valor">${esc(c.valor)}</div><p>${esc(c.porque)}</p></div>`).join('');
  const sim = q.simulador ? seccion('En el simulador LLT 3D', `<p class="rc-nota">${badge('simulador')} Estas son las cuatro variables que votarán todos los participantes, con los efectos tal como están programados en el simulador. Son estimaciones didácticas, no mediciones de una fábrica.</p>` +
    VARS.map(v => `<div class="rc-point"><strong>${esc(v.name)}</strong> · ${esc(v.q)}<p>${esc(v.sci)}</p><ul class="rc-opts">${v.opts.map((o, j) => `<li><b>${esc(o.l)}</b>${j === v.ref ? ' <em>(referencia)</em>' : ''}: ${esc(o.t)}</li>`).join('')}</ul></div>`).join('')) : '';
  return `<div class="rc-back-in">
    <span class="rc-eyebrow">Dentro del proceso · Etapa ${String(e.n).padStart(2, '0')}</span>
    <h4>${esc(q.titulo)}</h4><p class="rc-intro">${esc(q.intro)}</p>
    <div class="rc-molecules" aria-hidden="true">${q.particulas.map((t, j) => `<span class="rc-mol rc-mol--${t}" style="left:calc(${4 + (j * 31) % 88}% - ${((4 + (j * 31) % 88) * 0.36).toFixed(1)}px);top:calc(${8 + (j * 19) % 74}% - ${((8 + (j * 19) % 74) * 0.36).toFixed(1)}px);animation-delay:${(j % 8) * -0.5}s">${PART[t]}</span>`).join('')}</div>
    <p class="rc-leyenda">Representación esquemática · ${tipos.map(t => `<span class="rc-ley rc-ley--${t}"></span>${LEYENDA[t]}`).join(' · ')}</p>
    ${seccion('Entra → Sale', flujos, true)}
    ${seccion('Qué ocurre', ocurre)}
    ${seccion('Aditivos', aditivos)}
    ${seccion('Condiciones de operación y por qué importan', cond)}
    ${sim}
    ${seccion('Conexión con el resultado', `<div class="rc-point">${esc(q.conexion)}</div>`)}
    <div class="rc-bottom"><small>Revisión docente recomendada antes de exponer</small><button class="rc-btn alt" type="button" data-volver>↶ Volver a la máquina</button></div>
  </div>`;
}

/* ---------- etapa ---------- */
function render(i, { foco = false } = {}) {
  index = Math.max(0, Math.min(N - 1, i));
  const e = ETAPAS[index];
  girar(false);
  $('rc-num').textContent = `ETAPA ${String(e.n).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
  $('rc-titulo').textContent = e.titulo;
  $('rc-desc').textContent = e.descripcion;
  $('rc-facts').innerHTML = e.facts.map(f => `<span class="rc-fact">${esc(f)}</span>`).join('');
  $('rc-ill-label').textContent = `Máquina animada · ${e.rotulo}`;
  back.innerHTML = fichaQuimica(e);
  back.querySelector('[data-volver]').onclick = () => girar(false);
  $('rc-prev').disabled = index === 0;
  $('rc-next').textContent = index === N - 1 ? 'Finalizar recorrido →' : 'Siguiente →';
  $('rc-tabs').querySelectorAll('button').forEach((b, j) => { b.classList.toggle('active', j === index); b.setAttribute('aria-current', j === index ? 'step' : 'false'); });
  $('rc-tabs').querySelector('.active')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  if (proceso.hidden) return;
  history.replaceState(null, '', '#etapa-' + e.n);
  montar(index);
  if (foco) $('rc-titulo').focus({ preventScroll: true });
}

function mostrarProceso(scroll = true) {
  const antes = proceso.hidden;
  proceso.hidden = false;
  if (antes) render(index);
  if (scroll) requestAnimationFrame(() => proceso.scrollIntoView({ behavior: 'smooth' }));
}
function finalizar() {
  fin.hidden = false;
  if (anim) anim.pause();
  history.replaceState(null, '', '#siguiente');
  requestAnimationFrame(() => fin.scrollIntoView({ behavior: 'smooth' }));
}

ETAPAS.forEach((e, j) => e.n = j + 1);
$('rc-tabs').innerHTML = ETAPAS.map((e, j) => `<button type="button" data-i="${j}">${j + 1}. ${esc(e.titulo)}</button>`).join('');
$('rc-tabs').querySelectorAll('button').forEach(b => b.onclick = () => render(+b.dataset.i));
$('rc-flip').onclick = () => girar(!girada);
$('rc-prev').onclick = () => render(index - 1);
$('rc-next').onclick = () => index < N - 1 ? render(index + 1) : finalizar();
$('rc-volver').onclick = () => { proceso.scrollIntoView({ behavior: 'smooth' }); if (anim && !girada && !pausadaPorUsuario) anim.play(); };
$('rc-titulo').tabIndex = -1;
document.getElementById('begin').addEventListener('click', () => mostrarProceso());
document.querySelectorAll('.rc-end-modos a').forEach(a => a.addEventListener('click', ev => {
  if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button) return;
  ev.preventDefault(); if (anim) anim.pause(); irConFundido(a.getAttribute('href'));
}));
addEventListener('keydown', ev => {
  if (proceso.hidden || ev.altKey || ev.ctrlKey || ev.metaKey || /input|select|textarea/i.test(ev.target.tagName)) return;
  const r = proceso.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
  if (ev.key === 'ArrowRight' && index < N - 1) { render(index + 1); ev.preventDefault(); }
  else if (ev.key === 'ArrowLeft' && index > 0) { render(index - 1); ev.preventDefault(); }
  else if (ev.key === 'Escape' && girada) girar(false);
});

const h = location.hash, m = /^#etapa-(\d)$/.exec(h);
if (m || h === '#proceso' || h === '#siguiente') {
  index = m ? Math.min(N, Math.max(1, +m[1])) - 1 : h === '#siguiente' ? N - 1 : 0;
  mostrarProceso(false);
  if (h === '#siguiente') { fin.hidden = false; requestAnimationFrame(() => fin.scrollIntoView()); history.replaceState(null, '', '#siguiente'); }
  else requestAnimationFrame(() => proceso.scrollIntoView());
} else render(0);
