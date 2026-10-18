import test from 'node:test'; import assert from 'node:assert/strict';
import { computeResults as R, newState, reduce, groupCounts } from '../src/interactive/rules.js';
test('Ejemplo A · referencia', () => assert.deepEqual(R([1, 2, 1, 1]), { claridad: 93, color: 18, incrust: 10, merma: 1.00, perdidas: 0.35 }));
test('Ejemplo B · cuatro elecciones desfavorables', () => assert.deepEqual(R([0, 0, 0, 2]), { claridad: 37, color: 37, incrust: 16, merma: 3.25, perdidas: 2.00 }));
test('Ejemplo C · mixto', () => assert.deepEqual(R([2, 1, 2, 0]), { claridad: 83, color: 35, incrust: 43, merma: 1.90, perdidas: 0.75 }));
test('Reparto equilibrado en cuatro grupos', () => {
  for (const [n, esp] of Object.entries({ 16: [4, 4, 4, 4], 15: [4, 4, 4, 3], 13: [4, 3, 3, 3], 10: [3, 3, 2, 2] })) {
    const s = newState('T'); for (let i = 0; i < n; i++) reduce(s, { t: 'join', pid: 'p' + i }); reduce(s, { t: 'start' });
    assert.deepEqual(groupCounts(s).slice().sort((a, b) => b - a), esp, n + ' alumnos'); }
});
