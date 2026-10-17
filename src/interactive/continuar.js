/* Paso continuo del clarificador 3D a la animación final (final.html).
   Al terminar el recorrido, en lugar del informe aparece «Seguir el jugo hacia el evaporador».
   El informe completo se muestra al final de la animación. Con ?solo-llt se conserva el
   comportamiento original (informe #res dentro del clarificador). */
import { computeResults } from './rules.js';
import { calidadDesdeResultados, paletaAzucar, css } from './calidad.js';

export const SOLO_LLT = new URLSearchParams(location.search).has('solo-llt');
export const CLAVE = 'dcc-resultado';

let card = null, datos = null;
function crear() {
  if (card) return card;
  const pre = document.createElement('link'); pre.rel = 'prefetch'; pre.href = 'maquinas/08-final.js'; document.head.appendChild(pre);
  card = document.createElement('aside');
  card.id = 'llt-seguir'; card.setAttribute('aria-live', 'polite');
  card.innerHTML = '<span class="llt-eyebrow">JUGO CLARIFICADO · LISTO</span><strong>El jugo sale del LLT</strong><p>Seguilo por la tubería hacia la evaporación, la cristalización, la centrífuga y el secador.</p><button type="button">Seguir el jugo hacia el evaporador →</button>';
  card.querySelector('button').onclick = continuar;
  document.body.appendChild(card);
  return card;
}

/** choices: los 4 índices decididos (o null); extra: { modo, epoch } */
export function actualizar(choices, extra) {
  datos = Array.isArray(choices) && choices.length === 4 && choices.every(Number.isInteger) ? { choices: [...choices], ...extra } : null;
  crear();
  if (!datos) setAlpha(0);
}

export function setAlpha(a) {
  const c = crear(), on = !!datos && a > 0.02;
  c.style.opacity = on ? a : 0; c.style.visibility = on ? 'visible' : 'hidden';
  c.classList.toggle('on', on && a > 0.5);
  document.body.classList.toggle('res-on', on);
}

function continuar() {
  if (!datos) return;
  try { sessionStorage.setItem(CLAVE, JSON.stringify({ ...datos, t: Date.now() })); } catch {}
  const q = calidadDesdeResultados(computeResults(datos.choices));
  const velo = document.createElement('div');
  velo.id = 'llt-velo'; velo.style.background = css(paletaAzucar(q).jugo);
  document.body.appendChild(velo);
  requestAnimationFrame(() => velo.classList.add('on'));
  const url = `final.html?modo=${encodeURIComponent(datos.modo)}&ch=${datos.choices.join(',')}`;
  setTimeout(() => { location.href = url; }, 650);
}
