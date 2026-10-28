import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unlockedIndex, validatePalier } from '../js/figures.js';
import { restRemaining, formatSeconds } from '../js/timer.js';

const fig = {
  id: 'handstand',
  paliers: [
    { id: 'a', test: { type: 'tenue', valeur: 10 } },
    { id: 'b', test: { type: 'tenue', valeur: 10 } },
    { id: 'c', test: { type: 'reps', valeur: 5 } },
  ],
};

test('unlockedIndex: aucun palier validé -> 0', () => assert.equal(unlockedIndex(fig, []), 0));
test('unlockedIndex: a validé -> 1', () => assert.equal(unlockedIndex(fig, ['a']), 1));
test('unlockedIndex: tout validé -> longueur', () => assert.equal(unlockedIndex(fig, ['a', 'b', 'c']), 3));
test('unlockedIndex: pas de saut de palier (c seul validé)', () => assert.equal(unlockedIndex(fig, ['c']), 0));

test('validatePalier: palier 2 sans le 1 -> refusé', () => {
  const r = validatePalier(fig, [], 'b', 20);
  assert.equal(r.ok, false);
  assert.deepEqual(r.validated, []);
});

test('validatePalier: 9 s pour un test de 10 s -> refusé', () => {
  assert.equal(validatePalier(fig, [], 'a', 9).ok, false);
});

test('validatePalier: 10 s -> ok, palier ajouté une seule fois', () => {
  const r = validatePalier(fig, [], 'a', 10);
  assert.equal(r.ok, true);
  assert.deepEqual(r.validated, ['a']);
  const r2 = validatePalier(fig, r.validated, 'a', 12);
  assert.deepEqual(r2.validated, ['a']);
});

test('validatePalier: résultat non numérique -> refusé', () => {
  assert.equal(validatePalier(fig, [], 'a', NaN).ok, false);
  assert.equal(validatePalier(fig, [], 'a', undefined).ok, false);
});

test('validatePalier: palier inconnu -> refusé', () => {
  assert.equal(validatePalier(fig, [], 'zzz', 99).ok, false);
});

test('restRemaining (ms)', () => {
  assert.equal(restRemaining(10_000, 4_100), 6);
  assert.equal(restRemaining(10_000, 11_000), 0);
  assert.equal(restRemaining(10_000, 10_000), 0);
});

test('formatSeconds', () => {
  assert.equal(formatSeconds(65), '1:05');
  assert.equal(formatSeconds(0), '0:00');
  assert.equal(formatSeconds(-3), '0:00');
  assert.equal(formatSeconds(600), '10:00');
});
