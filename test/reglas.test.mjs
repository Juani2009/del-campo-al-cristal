import test from 'node:test'; import assert from 'node:assert/strict';
import { computeResults as R, newState, reduce, groupCounts } from '../src/interactive/rules.js';
test('Ejemplo A · referencia', () => assert.deepEqual(R([1, 2, 1, 1]), { claridad: 93, color: 18, incrust: 10, merma: 1.00, perdidas: 0.35 }));
test('Ejemplo B · cuatro elecciones desfavorables', () => assert.deepEqual(R([0, 0, 0, 2]), { claridad: 37, color: 37, incrust: 16, merma: 3.25, perdidas: 2.00 }));
test('Ejemplo C · mixto', () => assert.deepEqual(R([2, 1, 2, 0]), { claridad: 83, color: 35, incrust: 43, merma: 1.90, perdidas: 0.75 }));
test('Sesión demo: sin grupos, todos votan en cada estación', () => {
  const s = newState('T'); for (let i = 0; i < 6; i++) reduce(s, { t: 'join', pid: 'p' + i }); reduce(s, { t: 'start' });
  assert.deepEqual(groupCounts(s), [6, 6, 6, 6]);
  for (let i = 0; i < 4; i++) { assert.equal(reduce(s, { t: 'begin' }).ok, true);
    for (let k = 0; k < 6; k++) assert.equal(reduce(s, { t: 'vote', pid: 'p' + k, opt: 1 }).ok, true);
    assert.deepEqual(s.st[i].res, { k: 'winner', idx: 1 }); }
});
