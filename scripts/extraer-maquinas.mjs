/* Extrae las máquinas animadas de originales/*.html a public/maquinas/*.js sin modificarlas.
   - 01–07: se copian todos los <script> en orden; solo se quita la línea final que montaba la
     animación en la página de prueba (`XxxAnimado.mount(document.getElementById('escena-…'))`).
   - 08: se copian los <script> de datos, máquinas y AzucarFinal (no el de la página de prueba),
     el CSS del componente (.fin-anim) y se aplican los cambios documentados en PARCHES_08.
   Uso:  node scripts/extraer-maquinas.mjs             → escribe los archivos
         node scripts/extraer-maquinas.mjs --verificar → comprueba que los archivos coinciden */
import fs from 'node:fs';
import path from 'node:path';

const ORIG = path.resolve('originales'), OUT = path.resolve('public/maquinas');
const MAQUINAS = [
  ['01_Cosecha_Animada.html', '01-cosecha.js'],
  ['02_Molino_Animado.html', '02-molino.js'],
  ['03_Clarificador_Animado.html', '03-clarificador.js'],
  ['04_Evaporador_Animado (1).html', '04-evaporador.js'],
  ['05_Cristalizador_Animado.html', '05-cristalizador.js'],
  ['06_Centrifuga_Animada.html', '06-centrifuga.js'],
  ['07_Secador_Animado.html', '07-secador.js'],
];
const MONTAJE_DEMO = /^(?:window\.__\w+ = )?\w+\.mount\(document\.getElementById\('escena-[a-z]+'\)\);\n?$/m;

const scripts = html => [...html.matchAll(/<script>\n?([\s\S]*?)<\/script>/g)].map(m => m[1]);
const cabecera = (origen, nota) => `/* Extraído automáticamente de originales/${origen} por scripts/extraer-maquinas.mjs.\n   ${nota}\n   No editar a mano: volver a ejecutar el script. */\n`;

/* Cambios de la animación final para comenzar en la salida del clarificador LLT 3D.
   Cada texto original debe aparecer exactamente una vez; todo lo demás queda igual. */
const PARCHES_08 = [
  // (a) desdeLLT: no se agrega la clarificadora 2D al plano
  ["if (k === 'cla') { el.innerHTML =",
   "if (k === 'cla') { if (opts.desdeLLT) { el.remove(); delete hosts.cla; return; } el.innerHTML ="],
  // aviso de «lista» para levantar el velo de la transición
  ['setTimeout(function () { if (my !== token || destroyed) return; ready = true; resize();',
   "setTimeout(function () { if (my !== token || destroyed) return; ready = true; resize(); if (typeof opts.onReady === 'function') { try { opts.onReady(); } catch (e) {} }"],
  // (c) desdeLLT: las dos primeras claves de cámara siguen al jugo desde la salida del LLT
  ['      var K = [\n        [0, clC[0], clC[1], 1350], [3.2, clC[0] + 60, clC[1] + 10, 1350],\n',
   '      var p0 = pipes[0].p[0], fr = function (s) { return ptAt(pipes[0], s).slice(0, 2); };\n' +
   '      var K = opts.desdeLLT ? [\n        [0, p0[0] - 230, p0[1], 760], [1.3, p0[0] - 40, p0[1], 820], [3.2].concat(fr(430), [1000]),\n      ] : [\n        [0, clC[0], clC[1], 1350], [3.2, clC[0] + 60, clC[1] + 10, 1350],\n      ];\n      K = K.concat([\n'],
  ['        [119, dOut[0] - 120, dOut[1], 820], [123, dEnd[0], dEnd[1], 700], [130, dEnd[0], dEnd[1], 560], [137, dEnd[0], dEnd[1], 500]\n      ];\n',
   '        [119, dOut[0] - 120, dOut[1], 820], [123, dEnd[0], dEnd[1], 700], [130, dEnd[0], dEnd[1], 560], [137, dEnd[0], dEnd[1], 500]\n      ]);\n'],
  // (b) desdeLLT: tramo de tubería que llega desde el LLT, con su brida y el rótulo «Salida del LLT»
  ['        drawPipe(xB, Pp, t);\n      }\n',
   '        drawPipe(xB, Pp, t);\n      }\n      if (opts.desdeLLT) drawSalidaLLT(xB, t);\n'],
  // ritmo: acelera de forma suave la línea de tiempo fuera del tramo indicado (cristalización a su velocidad original).
  // Todo (cámara, tuberías, máquinas y partículas) depende de T, así que se mantiene sincronizado y no se omite nada.
  ['    var DUR = 137, TL_G = 54;\n',
   '    var DUR = 137, TL_G = 54;\n    var RIT = opts.ritmo;\n    function ritmo(t) { if (!RIT) return 1; var w = sm((t - RIT.desde + RIT.rampa) / RIT.rampa) * (1 - sm((t - RIT.hasta) / RIT.rampa)); return mix(RIT.factor, 1, w); }\n'],
  ['      T += Math.min(0.05, (ts - last) / 1000) * speed; last = ts;',
   '      T += Math.min(0.05, (ts - last) / 1000) * speed * ritmo(T); last = ts;'],
  ['    function bbox(Pp) {',
   `    function drawSalidaLLT(x, t) {                      // tramo que viene del clarificador 3D (fuera de cuadro, a la izquierda)
      var e = pipes[0].p[0], a = [e[0] - 900, e[1]], w = pipes[0].w0, i;
      var seg = { p: [a, [e[0] - 4, e[1]]], c: [0, e[0] - 4 - a[0]], L: e[0] - 4 - a[0], w0: w, w1: w };
      strokeTapered(x, seg, 0, seg.L, 1.16, 'rgba(96,126,152,.95)');
      strokeTapered(x, seg, 0, seg.L, 1.0, '#c3d3df');
      strokeTapered(x, seg, 0, seg.L, 0.66, '#e4edf4');
      strokeTapered(x, seg, 0, seg.L, 0.62, rgb(P.juice, 0.74 + 0.22 * P.turb));
      x.save(); x.setLineDash([22, 34]); x.lineDashOffset = -(t * 255 * 0.55); x.lineWidth = w * 0.5; x.strokeStyle = 'rgba(255,255,255,.14)';
      if (range(x, seg, 0, seg.L)) x.stroke(); x.restore();
      for (i = 0; i < 26; i++) {
        var s = mod(i * 34 + hash(i + 3) * 20 + t * 255 * 0.6, seg.L), pt = ptAt(seg, s), hh = (hash(i * 3 + 1) - 0.5) * w * 0.4, sp = 1.6 + hash(i + 9) * 2.4;
        if (hash(i + 33) < P.turb * 1.1) { x.fillStyle = 'rgba(52,32,12,' + (0.35 + 0.4 * P.turb) + ')'; x.beginPath(); x.arc(pt[0], pt[1] + hh, sp * (0.7 + P.turb), 0, TAU); x.fill(); }
      }
      x.fillStyle = '#b4c7d6'; x.strokeStyle = 'rgba(96,126,152,.95)'; x.lineWidth = 1.5;
      x.beginPath(); x.rect(e[0] - 360, e[1] - w * 0.62, 10, w * 1.24); x.fill(); x.stroke();
      var tx = e[0] - 330, ty = e[1] - w * 1.6;
      x.font = '600 26px system-ui, -apple-system, "Segoe UI", sans-serif'; var tw = x.measureText('SALIDA DEL CLARIFICADOR LLT').width;
      x.fillStyle = 'rgba(255,255,255,.92)'; x.strokeStyle = 'rgba(96,126,152,.55)'; x.lineWidth = 1.5;
      x.beginPath(); x.rect(tx - 16, ty - 30, tw + 32, 44); x.fill(); x.stroke();
      x.fillStyle = '#35566c'; x.fillText('SALIDA DEL CLARIFICADOR LLT', tx, ty);
    }
    function bbox(Pp) {`],
];

function aplicarParches(js) {
  for (const [de, a] of PARCHES_08) {
    const n = js.split(de).length - 1;
    if (n !== 1) throw new Error(`Parche de la 08: se esperaba 1 coincidencia y hay ${n}:\n${de.slice(0, 90)}`);
    js = js.replace(de, () => a);
  }
  return js;
}

function generar() {
  const out = {};
  for (const [origen, destino] of MAQUINAS) {
    const bloques = scripts(fs.readFileSync(path.join(ORIG, origen), 'utf8'));
    const ultimo = bloques.length - 1;
    if (!MONTAJE_DEMO.test(bloques[ultimo])) throw new Error('No se encontró el montaje de prueba en ' + origen);
    bloques[ultimo] = bloques[ultimo].replace(MONTAJE_DEMO, '');
    out[destino] = cabecera(origen, 'Contenido original sin cambios (solo se quitó el montaje de la página de prueba).') + bloques.map(b => `;${b}\n`).join('');
  }
  const html = fs.readFileSync(path.join(ORIG, '08_Animacion_Final.html'), 'utf8');
  const bloques = scripts(html);
  if (bloques.length !== 4 || !/AzucarFinal\.mount\(el/.test(bloques[3])) throw new Error('Estructura inesperada en 08_Animacion_Final.html');
  out['08-final.js'] = cabecera('08_Animacion_Final.html', 'Incluye los cambios documentados en PARCHES_08 (opciones desdeLLT, onReady y ritmo).') +
    aplicarParches(bloques.slice(0, 3).map(b => `;${b}\n`).join(''));
  const css = /\/\* ---- estilos del componente[\s\S]*?(?=<\/style>)/.exec(html);
  if (!css) throw new Error('No se encontró el CSS del componente en la 08');
  out['08-final.css'] = '/* Extraído de originales/08_Animacion_Final.html (estilos del componente .fin-anim, sin cambios). */\n' + css[0];
  return out;
}

const archivos = generar();
if (process.argv.includes('--verificar')) {
  let mal = 0;
  for (const [n, c] of Object.entries(archivos)) {
    const p = path.join(OUT, n);
    if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== c) { console.log('✗ Distinto de su original:', n); mal++; }
    else console.log('✓', n);
  }
  process.exit(mal ? 1 : 0);
} else {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [n, c] of Object.entries(archivos)) { fs.writeFileSync(path.join(OUT, n), c); console.log('→', n, (c.length / 1e6).toFixed(2), 'MB'); }
}
