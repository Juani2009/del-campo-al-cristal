/* Paso continuo del clarificador 3D a la animación final (final.html).
   Al terminar el recorrido, en lugar del informe aparece «Seguir el jugo hacia el evaporador».
   El informe completo se muestra al final de la animación. Con ?solo-llt se conserva el
   comportamiento original (informe #res dentro del clarificador). */

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

let iframe = null, enCurso = false;
function continuar() {
  if (!datos || enCurso) return;
  enCurso = true;
  try { sessionStorage.setItem(CLAVE, JSON.stringify({ ...datos, t: Date.now() })); } catch {}
  const url = `final.html?modo=${encodeURIComponent(datos.modo)}&ch=${datos.choices.join(',')}`;
  const boton = card.querySelector('button');
  boton.disabled = true; boton.textContent = 'Preparando la animación…';
  // El 3D sigue visible y en movimiento mientras la animación final se prepara oculta;
  // mientras tanto se dibuja a menos cuadros por segundo para dejarle tiempo a la carga.
  window.LLTAhorro = true;
  iframe = Object.assign(document.createElement('iframe'), { id: 'llt-final', title: 'Animación final: del jugo al azúcar', src: url + '&embebido=1' });
  document.body.appendChild(iframe);
  const irDirecto = () => { location.href = url; };
  const limite = setTimeout(irDirecto, 25000);
  const alMensaje = ev => {
    if (ev.origin !== location.origin || ev.source !== iframe?.contentWindow) return;
    if (ev.data?.dcc === 'error') { clearTimeout(limite); removeEventListener('message', alMensaje); irDirecto(); }
    if (ev.data?.dcc !== 'listo') return;
    clearTimeout(limite); removeEventListener('message', alMensaje);
    iframe.contentWindow.postMessage({ dcc: 'play' }, location.origin);   // el jugo ya avanza durante el fundido
    iframe.classList.add('on'); card.classList.add('saliendo');
    setTimeout(() => {
      window.LLTPausa = true; window.LLTAhorro = false;                    // deja de dibujar el 3D, ya oculto
      document.body.classList.add('llt-en-final');
      try { history.pushState({ dcc: 'final' }, '', url); } catch {}
      iframe.focus();
    }, 750);
  };
  addEventListener('message', alMensaje);
}
// «Atrás» desde la animación final vuelve al clarificador 3D.
addEventListener('popstate', () => {
  if (!iframe || history.state?.dcc === 'final') return;
  iframe.remove(); iframe = null; enCurso = false; window.LLTPausa = false; window.LLTAhorro = false;
  document.body.classList.remove('llt-en-final');
  if (card) { card.classList.remove('saliendo'); const b = card.querySelector('button'); b.disabled = false; b.textContent = 'Seguir el jugo hacia el evaporador →'; }
});
