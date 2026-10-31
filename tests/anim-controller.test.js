import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VUES, creerLecteur, avancer, basculerPause, basculerRalenti, vueSuivante, webglDisponible, choisirRendu,
} from '../js/anim/controller.js';

const proche = (a, b, eps = 0.0001) => assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`);

test('VUES: profil, face, trois-quarts et dessus ont une caméra complète', () => {
  for (const v of ['profil', 'face', 'trois-quarts', 'dessus']) {
    const c = VUES[v];
    assert.ok(c && ['azimut', 'elevation', 'distance'].every((k) => typeof c[k] === 'number'), v);
  }
});

test('avancer: ajoute le temps écoulé, sans modifier l\'objet d\'entrée', () => {
  const l = creerLecteur('profil');
  const l2 = avancer(l, 16);
  proche(l2.elapsed, 0.016);
  assert.equal(l.elapsed, 0);
});

test('avancer: un énorme saut de temps (onglet en arrière-plan) est plafonné à 100 ms', () => {
  proche(avancer(creerLecteur('profil'), 5000).elapsed, 0.1);
});

test('avancer: en pause le temps ne bouge pas, en ralenti il passe deux fois moins vite', () => {
  assert.equal(avancer(basculerPause(creerLecteur('profil')), 100).elapsed, 0);
  proche(avancer(basculerRalenti(creerLecteur('profil')), 100).elapsed, 0.05);
});

test('basculerPause et basculerRalenti reviennent à l\'état initial au 2e appel', () => {
  const l = creerLecteur('face');
  assert.equal(basculerPause(basculerPause(l)).enPause, false);
  assert.equal(basculerRalenti(basculerRalenti(l)).vitesse, 1);
});

test('vueSuivante: cycle profil → face → trois-quarts → dessus → profil, inconnue → profil', () => {
  assert.equal(vueSuivante('profil'), 'face');
  assert.equal(vueSuivante('face'), 'trois-quarts');
  assert.equal(vueSuivante('trois-quarts'), 'dessus');
  assert.equal(vueSuivante('dessus'), 'profil');
  assert.equal(vueSuivante('inconnue'), 'profil');
});

test('webglDisponible: faux si le contexte est nul ou si la création lève une exception', () => {
  assert.equal(webglDisponible({ createElement: () => ({ getContext: () => null }) }), false);
  assert.equal(webglDisponible({ createElement: () => ({ getContext: () => { throw new Error('boum'); } }) }), false);
  assert.equal(webglDisponible({ createElement: () => { throw new Error('pas de canvas'); } }), false);
  assert.equal(webglDisponible({ createElement: () => ({ getContext: () => ({}) }) }), true);
});

test('choisirRendu: svg sans animation ou sans WebGL, pose fixe si mouvement réduit, sinon animé', () => {
  const anim = { duree: 2 };
  assert.equal(choisirRendu({ animation: undefined, webgl: true, reduireMouvement: false }), 'svg');
  assert.equal(choisirRendu({ animation: anim, webgl: false, reduireMouvement: false }), 'svg');
  assert.equal(choisirRendu({ animation: anim, webgl: true, reduireMouvement: true }), 'pose-fixe');
  assert.equal(choisirRendu({ animation: anim, webgl: true, reduireMouvement: false }), 'anime');
  assert.equal(choisirRendu({ animation: undefined, webgl: true, reduireMouvement: true }), 'svg');
});
