import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const exercices = lire('exercices.json');
const programme = lire('programme.json');
const figures = lire('figures.json');
const ids = new Set(exercices.map((e) => e.id));

test('test_exercices_count', () => {
  assert.ok(exercices.length >= 65 && exercices.length <= 80, `${exercices.length} exercices`);
});

test('test_ids_uniques', () => {
  assert.equal(ids.size, exercices.length);
});

test('test_champs_obligatoires', () => {
  const groupes = ['poussee', 'tirage', 'jambes', 'gainage', 'equilibre', 'figure', 'mobilite'];
  for (const e of exercices) {
    assert.ok(e.nom, `${e.id}: nom`);
    assert.ok(groupes.includes(e.groupe), `${e.id}: groupe`);
    assert.ok(e.lieux.length >= 1 && e.lieux.every((l) => ['maison', 'street'].includes(l)), `${e.id}: lieux`);
    assert.ok(e.difficulte >= 1 && e.difficulte <= 5, `${e.id}: difficulte`);
    assert.ok(['reps', 'tenue'].includes(e.type), `${e.id}: type`);
    assert.ok(e.etapes.length >= 3 && e.etapes.length <= 5, `${e.id}: etapes ${e.etapes.length}`);
    assert.ok(e.plage.min <= e.plage.max && e.plage.min >= 1, `${e.id}: plage`);
    assert.ok(e.series >= 1 && e.repos >= 0, `${e.id}: series/repos`);
    assert.ok(e.illustration, `${e.id}: illustration`);
    assert.ok(Array.isArray(e.conseils) && Array.isArray(e.erreurs) && Array.isArray(e.muscles), `${e.id}: listes`);
  }
});

test('test_references_valides', () => {
  const verifie = (id, ou) => assert.ok(id === null || ids.has(id), `${ou}: id inconnu "${id}"`);
  for (const e of exercices) {
    verifie(e.plusFacile, `${e.id}.plusFacile`);
    verifie(e.plusDur, `${e.id}.plusDur`);
    verifie(e.substitut.maison, `${e.id}.substitut.maison`);
    verifie(e.substitut.street, `${e.id}.substitut.street`);
  }
  for (const j of programme.semaine) for (const b of j.blocs) verifie(b.exerciceId, `programme ${j.jour}`);
  for (const id of [...programme.echauffement, ...programme.etirements]) verifie(id, 'echauffement/etirements');
  for (const f of figures) for (const p of f.paliers) verifie(p.exerciceId, `figure ${f.id}`);
});

test('test_semaine_complete', () => {
  const attendu = {
    lun: ['street', 'tirage'], mar: ['maison', 'jambes-gainage'], mer: ['street', 'poussee'],
    jeu: ['maison', 'equilibre-mobilite'], ven: ['street', 'figures'], sam: ['maison', 'corps-entier'], dim: [null, 'repos'],
  };
  assert.equal(programme.semaine.length, 7);
  for (const j of programme.semaine) {
    assert.deepEqual([j.lieu, j.seance], attendu[j.jour], j.jour);
  }
  assert.equal(programme.semaine.find((j) => j.jour === 'dim').blocs.length, 0);
  assert.equal(programme.decharge.toutesLesSemaines, 5);
  assert.ok(programme.decharge.facteur > 0 && programme.decharge.facteur < 1);
});

test('test_figures_cinq_parcours', () => {
  assert.deepEqual(figures.map((f) => f.id).sort(), ['drapeau', 'frontlever', 'handstand', 'muscleup', 'planche']);
  for (const f of figures) {
    assert.ok(f.paliers.length >= 3, f.id);
    for (const p of f.paliers) assert.ok(p.test.valeur > 0 && ['tenue', 'reps'].includes(p.test.type), p.id);
  }
});

test('test_substitut_pour_chaque_lieu_manquant', () => {
  for (const e of exercices) {
    if (!e.lieux.includes('maison')) assert.ok(e.substitut.maison, `${e.id}: pas de substitut maison`);
    if (!e.lieux.includes('street')) assert.ok(e.substitut.street, `${e.id}: pas de substitut street`);
  }
});

test('test_substituts_disponibles_au_lieu', () => {
  const par = Object.fromEntries(exercices.map((e) => [e.id, e]));
  for (const e of exercices) {
    if (e.substitut.maison) assert.ok(par[e.substitut.maison].lieux.includes('maison'), `${e.id} -> substitut maison indisponible`);
    if (e.substitut.street) assert.ok(par[e.substitut.street].lieux.includes('street'), `${e.id} -> substitut street indisponible`);
  }
});

test('test_seances_utilisables_dans_les_deux_lieux', () => {
  // Chaque bloc doit pouvoir être joué à la maison comme en street, directement ou via un substitut.
  const par = Object.fromEntries(exercices.map((e) => [e.id, e]));
  for (const j of programme.semaine) for (const b of j.blocs) {
    for (const lieu of ['maison', 'street']) {
      const e = par[b.exerciceId];
      assert.ok(e.lieux.includes(lieu) || e.substitut[lieu], `${j.jour}/${b.exerciceId} injouable à ${lieu}`);
    }
  }
});
