import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calibrateRange, calibrateProfile, evaluate } from '../js/progression.js';

test('calibrateRange(5) -> 3-5', () => {
  assert.deepEqual(calibrateRange(5), { min: 3, max: 5 });
});

test('calibrateRange valeurs invalides -> 1-1', () => {
  assert.deepEqual(calibrateRange(0), { min: 1, max: 1 });
  assert.deepEqual(calibrateRange(NaN), { min: 1, max: 1 });
  assert.deepEqual(calibrateRange(-3), { min: 1, max: 1 });
  assert.deepEqual(calibrateRange(undefined), { min: 1, max: 1 });
});

test('calibrateProfile({}) donne des plages valides pour chaque clé', () => {
  const p = calibrateProfile({});
  for (const k of ['pompes', 'diamant', 'tractions', 'dips', 'planche']) {
    assert.ok(p[k].min >= 1 && p[k].min <= p[k].max, k);
  }
});

test('calibrateProfile ne lève pas avec une planche inconnue', () => {
  const p = calibrateProfile({ tractions: 5, planche: undefined, pompes: '', dips: null });
  assert.deepEqual(p.tractions, { min: 3, max: 5 });
  assert.equal(p.planche.max, 20); // défaut sûr de 20 s
});

test('calibrateProfile accepte des chaînes numériques', () => {
  assert.deepEqual(calibrateProfile({ pompes: '10' }).pompes, { min: 6, max: 10 });
});

const ex = { id: 'tractions-pronation', plage: { min: 3, max: 5 }, plusDur: 'tractions-larges' };

test('evaluate: toutes séries au max -> variante plus dure', () => {
  assert.deepEqual(evaluate(ex, [5, 5, 5]), { action: 'variante-plus-dure', exerciceId: 'tractions-larges' });
});

test('evaluate: série sous le min -> maintenir', () => {
  assert.deepEqual(evaluate(ex, [5, 5, 2]), { action: 'maintenir', exerciceId: 'tractions-pronation' });
});

test('evaluate: entre les deux -> plus de reps', () => {
  assert.deepEqual(evaluate(ex, [4, 4, 3]), { action: 'plus-de-reps', exerciceId: 'tractions-pronation' });
});

test('evaluate: aucune série -> maintenir', () => {
  assert.equal(evaluate(ex, []).action, 'maintenir');
});

test('evaluate: au max sans variante plus dure -> plus de reps', () => {
  assert.equal(evaluate({ ...ex, plusDur: null }, [5, 5, 5]).action, 'plus-de-reps');
});
