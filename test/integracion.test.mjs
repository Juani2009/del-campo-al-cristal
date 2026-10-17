import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { computeResults, VARS } from '../src/interactive/rules.js';
import { calidadDesdeResultados, categoria, COLOR_MIN, COLOR_MAX, paletaAzucar, toneRGB, azucarMonton } from '../src/interactive/calidad.js';
import { sugar } from '../src/interactive/results.js';
import { ETAPAS, FUENTES } from '../src/proceso/etapas.js';

const todas = [];
for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) for (let d = 0; d < 3; d++) todas.push([a, b, c, d]);

test('El rango de color sale de la tabla VARS (18–40)', () => {
  assert.equal(COLOR_MIN, 18); assert.equal(COLOR_MAX, 40);
  const colores = todas.map(ch => computeResults(ch).color);
  assert.equal(Math.min(...colores), COLOR_MIN); assert.equal(Math.max(...colores), COLOR_MAX);
});
test('Referencia ⇒ azúcar clara (q=1); peor combinación ⇒ oscura (q=0)', () => {
  assert.equal(calidadDesdeResultados(computeResults([1, 2, 1, 1])), 1);
  const peor = todas.reduce((m, ch) => computeResults(ch).color > computeResults(m).color ? ch : m);
  assert.equal(calidadDesdeResultados(computeResults(peor)), 0);
  assert.equal(categoria(1).id, 'clara'); assert.equal(categoria(0).id, 'oscura');
  // la categoría sigue a lo que se ve: q=0,5 es el tono original (blanco) de la 08
  assert.equal(categoria(0.5).id, 'clara'); assert.equal(categoria(0.3).id, 'intermedia'); assert.equal(categoria(0.1).id, 'oscura');
});
test('Más color ⇒ menor calidad (monótono) para las 81 combinaciones', () => {
  const pares = todas.map(ch => { const r = computeResults(ch); return [r.color, calidadDesdeResultados(r)]; }).sort((x, y) => x[0] - y[0]);
  for (let i = 1; i < pares.length; i++) assert.ok(pares[i][1] <= pares[i - 1][1]);
});
test('Las funciones de color copian exactamente las de la animación 08', () => {
  const js = fs.readFileSync(new URL('../public/maquinas/08-final.js', import.meta.url), 'utf8');
  assert.match(js, /if \(s < 0\) \{ k = -s; r \*= 1 - 0\.24 \* k; g \*= 1 - 0\.38 \* k; b \*= 1 - 0\.56 \* k; \}/);
  assert.match(js, /else if \(s > 0\) \{ r \+= \(255 - r\) \* 0\.10 \* s; g \+= \(255 - g\) \* 0\.22 \* s; b \+= \(255 - b\) \* 0\.12 \* s; \}/);
  assert.match(js, /juice: pal3\(q, \[84, 50, 20\], \[222, 172, 64\], \[247, 228, 140\]\)/);
  assert.match(js, /TN\.s = \(q - 0\.5\) \* 2/);
  assert.deepEqual(toneRGB(0.5, 252, 249, 240), [252, 249, 240]);
  assert.deepEqual(paletaAzucar(1).jugo, [247, 228, 140]);
});
test('El informe dibuja el azúcar con el mismo tono que la bolsa de la 08', () => {
  for (const ch of [[1, 2, 1, 1], [0, 0, 0, 2], [2, 1, 2, 0]]) {
    const r = computeResults(ch), q = calidadDesdeResultados(r), c = azucarMonton(q, 1.04).map(Math.round);
    assert.ok(sugar(r).includes(`rgba(${c[0]},${c[1]},${c[2]},1)`), 'tono del montículo ' + ch);
  }
  const clara = azucarMonton(1), oscura = azucarMonton(0);
  assert.ok(clara[2] > oscura[2] + 60, 'la oscura es visiblemente más oscura');
});
test('Las máquinas extraídas coinciden con los originales', () => {
  execFileSync(process.execPath, ['scripts/extraer-maquinas.mjs', '--verificar'], { stdio: 'pipe' });
});
test('Siete etapas con ficha química completa y fuentes existentes', () => {
  assert.equal(ETAPAS.length, 7);
  for (const e of ETAPAS) {
    const q = e.quimica;
    assert.ok(q.entra.length && q.sale.length && q.ocurre.length && q.condiciones.length && q.conexion, e.id);
    assert.ok(q.aditivos.ninguno || q.aditivos.lista.every(a => a.para && a.como && a.limite), e.id);
    for (const c of q.condiciones) {
      assert.ok(['industrial', 'simulador', 'cualitativo'].includes(c.origen), e.id + ' ' + c.variable);
      if (c.origen === 'industrial') assert.ok(c.fuentes?.length, 'cifra industrial sin fuente: ' + c.variable);
    }
    [...q.fuentes, ...q.condiciones.flatMap(c => c.fuentes || [])].forEach(f => assert.ok(FUENTES[f], 'fuente ' + f));
    assert.ok(fs.existsSync(new URL('../public/maquinas/' + e.maquina.archivo, import.meta.url)));
  }
  assert.equal(VARS.length, 4);
});
