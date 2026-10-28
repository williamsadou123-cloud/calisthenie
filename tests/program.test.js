import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSession, isDeloadWeek } from '../js/program.js';
import { calibrateProfile } from '../js/progression.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const exercices = lire('exercices.json');
const programme = lire('programme.json');
const par = Object.fromEntries(exercices.map((e) => [e.id, e]));
const profil = calibrateProfile({ pompes: 10, diamant: 10, tractions: 5, dips: 5 });

test('buildSession: lundi street contient du tirage', () => {
  const s = buildSession(programme, exercices, 'lun', 'street', profil, false);
  assert.equal(s.titre, 'Tirage');
  assert.ok(s.blocs.some((b) => b.exerciceId === 'tractions-pronation'));
});

test('buildSession: lundi demandé à la maison -> uniquement des exercices faisables à la maison', () => {
  const s = buildSession(programme, exercices, 'lun', 'maison', profil, false);
  assert.ok(s.blocs.length > 0);
  for (const b of s.blocs) {
    assert.ok(par[b.exerciceId], `id introuvable ${b.exerciceId}`);
    assert.ok(par[b.exerciceId].lieux.includes('maison'), `${b.exerciceId} impossible à la maison`);
  }
});

test('buildSession: aucun doublon quand deux exercices ont le même substitut', () => {
  const s = buildSession(programme, exercices, 'lun', 'maison', profil, false);
  const ids = s.blocs.map((b) => b.exerciceId);
  assert.equal(new Set(ids).size, ids.length);
});

test('buildSession: toutes les séances sont jouables dans les deux lieux', () => {
  for (const j of programme.semaine) for (const lieu of ['maison', 'street']) {
    const s = buildSession(programme, exercices, j.jour, lieu, profil, false);
    for (const b of s.blocs) assert.ok(par[b.exerciceId].lieux.includes(lieu), `${j.jour}/${lieu}/${b.exerciceId}`);
  }
});

test('buildSession: dimanche -> blocs vides', () => {
  assert.equal(buildSession(programme, exercices, 'dim', 'maison', profil, false).blocs.length, 0);
});

test('buildSession: la plage de répétitions des tractions suit le profil (3-5)', () => {
  const s = buildSession(programme, exercices, 'lun', 'street', profil, false);
  const b = s.blocs.find((x) => x.exerciceId === 'tractions-pronation');
  assert.deepEqual(b.plage, { min: 3, max: 5 });
});

test('buildSession: décharge réduit les séries sans descendre sous 1', () => {
  const normal = buildSession(programme, exercices, 'mar', 'maison', profil, false);
  const dech = buildSession(programme, exercices, 'mar', 'maison', profil, true);
  assert.equal(normal.blocs.length, dech.blocs.length);
  dech.blocs.forEach((b, i) => {
    assert.ok(b.series >= 1);
    assert.ok(b.series <= normal.blocs[i].series);
  });
  assert.ok(dech.blocs.some((b, i) => b.series < normal.blocs[i].series));
});

test('buildSession: jour inconnu -> séance vide sans erreur', () => {
  assert.deepEqual(buildSession(programme, exercices, 'xyz', 'maison', profil, false).blocs, []);
});

test('isDeloadWeek: semaine 1 faux, semaine 5 vrai, semaine 10 vrai, semaine 6 faux', () => {
  assert.equal(isDeloadWeek('2026-11-02', '2026-11-02', 5), false);
  assert.equal(isDeloadWeek('2026-11-02', '2026-11-30', 5), true); // 5e semaine
  assert.equal(isDeloadWeek('2026-11-02', '2026-12-07', 5), false); // 6e
  assert.equal(isDeloadWeek('2026-11-02', '2027-01-04', 5), true); // 10e
});

test('isDeloadWeek: changement d\'heure (25 -> 26 octobre) sans décalage', () => {
  // semaine 5 commence 28 jours après le début. 2026-10-05 + 28 j = 2026-11-02 (traverse le passage à l\'heure d\'hiver)
  assert.equal(isDeloadWeek('2026-10-05', '2026-11-02', 5), true);
  assert.equal(isDeloadWeek('2026-10-05', '2026-11-01', 5), false);
});

test('isDeloadWeek: date avant le début ou invalide -> faux', () => {
  assert.equal(isDeloadWeek('2026-11-02', '2026-10-01', 5), false);
  assert.equal(isDeloadWeek('n/a', '2026-10-01', 5), false);
});
