/* Fundido a negro entre el recorrido 2D y el clarificador 3D (≈1 s en total).
   La capa negra es html::after (CSS en clarificador.html y proceso.css), así existe desde el primer cuadro. */
export const CLAVE_FUNDIDO = 'dcc-fundido';
const html = document.documentElement;
const reducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Oscurece la pantalla; se resuelve cuando ya está negra. */
export function cubrir(ms = 450) {
  html.classList.add('dcc-negro');
  return new Promise(ok => setTimeout(ok, reducido() ? 0 : ms));
}

/** Aclara la pantalla (con dos cuadros de margen para que el 3D ya esté dibujado). */
export function revelar() {
  requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove('dcc-negro')));
}

/** Espera a que la escena 3D esté lista (si se está cargando) y después aclara. */
export function revelarCuandoListo(esperarEscena) {
  if (!html.classList.contains('dcc-negro')) return;
  if (!esperarEscena || document.body.classList.contains('llt-scene-ready')) { revelar(); return; }
  const fin = () => { obs.disconnect(); clearTimeout(t); setTimeout(revelar, 120); };
  const obs = new MutationObserver(() => { if (document.body.classList.contains('llt-scene-ready')) fin(); });
  obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  const t = setTimeout(fin, 8000);
}

/** Recorrido 2D → clarificador: oscurece, recuerda que hay que aclarar del otro lado y navega. */
export function irConFundido(url) {
  try { sessionStorage.setItem(CLAVE_FUNDIDO, '1'); } catch {}
  cubrir().then(() => { location.href = url; });
}
// Al volver con «Atrás» (página restaurada de la caché), no debe quedar negra.
addEventListener('pageshow', ev => { if (ev.persisted) html.classList.remove('dcc-negro'); });
