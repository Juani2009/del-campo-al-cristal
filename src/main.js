/* Entrada liviana: no se carga WebGL hasta entrar a una modalidad o iniciar la sesión. */
import './errors.js';
import './styles/main.css';
import './interactive/presentation.css';

const WEB = import.meta.env.MODE === 'web';   // versión web estática: sin servidor de votaciones
if (WEB) document.body.classList.add('llt-web');
let mode = new URLSearchParams(location.search).get('modo');
if (WEB && mode === 'grupal') mode = null;
const choose = document.getElementById('mode-choice');
const lobby = document.getElementById('lobby');

let scenePromise;
function startScene(Votes) {
  if (scenePromise) return scenePromise;
  scenePromise = (async () => {
    await import('./llt/clarificador.js');
    const [{ initTRDDetail }, { initPipeFlow }, { initDirector }] = await Promise.all([
      import('./llt/trd-detail.js'),import('./llt/pipe-flow.js'),import('./llt/director.js')
    ]);
    initTRDDetail({ index: 7 });
    initPipeFlow();
    initDirector(Votes);
    document.body.classList.add('llt-scene-ready');
  })();
  return scenePromise;
}
if (mode === 'individual') {
  choose.hidden = true;
  lobby.hidden = true;
  document.body.classList.add('llt-mode-individual');
  const { Votes } = await import('./interactive/solo.js');
  await startScene(Votes);
} else if (mode === 'grupal') {
  choose.hidden = true;
  lobby.hidden = false;
  document.body.classList.add('llt-mode-grupal');
  const { Votes } = await import('./interactive/voting.js');
  window.LLTStartScene = () => startScene(Votes);
  // Durante la sala de espera no se construye ni dibuja el clarificador 3D.
  window.dispatchEvent(new Event('llt:escena-disponible'));
} else {
  choose.hidden = false;
  lobby.hidden = true;
  document.body.classList.add('llt-mode-choose');
  document.getElementById('tbtn').hidden = true;
}
