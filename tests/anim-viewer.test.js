import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creerGestionnaire, montrerAnimation, gestionnaire } from '../js/anim/viewer.js';

const sansWebgl = { createElement: () => ({ getContext: () => null }) };
const exercice = { id: 'pompes', illustration: 'pompe' };
const dataAvec = { animations: { exercices: { pompes: { duree: 2, mode: 'boucle', poses: [] } } } };
const dataSans = { animations: { exercices: {} } };
const compteur = () => { let n = 0; return { destroy() { n++; }, get n() { return n; } }; };

test('gestionnaire: remplacer détruit le rendu précédent, un seul rendu reste actif', () => {
  const g = creerGestionnaire();
  const a = compteur();
  const b = compteur();
  g.remplacer(a);
  g.remplacer(b);
  assert.equal(a.n, 1);
  assert.equal(b.n, 0);
});

test('gestionnaire: detruire est idempotent', () => {
  const g = creerGestionnaire();
  const b = compteur();
  g.remplacer(b);
  g.detruire();
  g.detruire();
  assert.equal(b.n, 1);
});

test('exercice sans animation: le SVG est affiché, sans erreur, destroy appelable deux fois', async () => {
  const zone = { innerHTML: '' };
  const h = await montrerAnimation(zone, exercice, dataSans, { doc: sansWebgl });
  assert.match(zone.innerHTML, /<svg/);
  h.destroy();
  h.destroy();
});

test('animation présente mais WebGL indisponible: le SVG est affiché', async () => {
  const zone = { innerHTML: '' };
  await montrerAnimation(zone, exercice, dataAvec, { doc: sansWebgl });
  assert.match(zone.innerHTML, /<svg/);
});

test('données d\'animation absentes: le SVG est affiché sans erreur', async () => {
  const zone = { innerHTML: '' };
  await montrerAnimation(zone, exercice, {}, { doc: sansWebgl });
  assert.match(zone.innerHTML, /<svg/);
});

test('changer de zone détruit le rendu précédent (un seul actif)', async () => {
  const a = compteur();
  gestionnaire.remplacer(a);
  await montrerAnimation({ innerHTML: '' }, exercice, dataSans, { doc: sansWebgl });
  assert.equal(a.n, 1);
  gestionnaire.detruire();
});

test('chargement tardif: un rendu lancé puis dépassé par un autre est détruit sans écraser le récent', async () => {
  const avecWebgl = { createElement: () => ({ getContext: () => ({}) }) };
  let finir;
  const lent = compteur();
  const animerLent = () => new Promise((ok) => { finir = () => ok(lent); });
  const p1 = montrerAnimation({ innerHTML: '' }, exercice, dataAvec, { doc: avecWebgl, reduireMouvement: false, animer: animerLent });
  const recent = { innerHTML: '' };
  await montrerAnimation(recent, exercice, dataSans, { doc: sansWebgl }); // 2e appel: dessin SVG
  finir();
  await p1;
  assert.equal(lent.n, 1, 'le rendu tardif doit être détruit');
  assert.match(recent.innerHTML, /<svg/, 'le rendu récent reste affiché');
  gestionnaire.detruire();
});
