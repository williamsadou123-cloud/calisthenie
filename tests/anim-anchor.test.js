import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFK } from '../js/anim/skeleton.js';
import { ancrer } from '../js/anim/anchor.js';

const proche = (a, b, eps = 0.001) => assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b} (±${eps})`);
const ys = (fk) => Object.values(fk).map((p) => p.pos[1]);

test('debout + sol: le point le plus bas est à 0 et la taille est conservée', () => {
  const fk = ancrer(computeFK({}), { type: 'sol' });
  proche(Math.min(...ys(fk)), 0);
  proche(fk.sommet_tete.pos[1], 1.75, 0.03);
});

test('planche au sol: seul y change, x et z restent', () => {
  const brut = computeFK({ bassin: [90, 0, 0], epaule_g: [-90, 0, 0], epaule_d: [-90, 0, 0] });
  const fk = ancrer(brut, { type: 'sol' });
  proche(Math.min(...ys(fk)), 0);
  for (const n of Object.keys(brut)) {
    proche(fk[n].pos[0], brut[n].pos[0], 1e-9);
    proche(fk[n].pos[2], brut[n].pos[2], 1e-9);
  }
  proche(fk.main_g.pos[1], 0, 0.02); // les mains touchent le sol, bras tendus
});

test('équilibre sur les mains: mains au sol, pieds en haut', () => {
  const fk = ancrer(computeFK({ bassin: [180, 0, 0], epaule_g: [-180, 0, 0], epaule_d: [-180, 0, 0] }), { type: 'sol' });
  assert.ok(fk.main_g.pos[1] < 0.02 && fk.main_d.pos[1] < 0.02);
  assert.ok(fk.pied_g.pos[1] > 1.4);
});

test('suspendu à la barre: les mains sont sur la barre, les pieds dans le vide', () => {
  const fk = ancrer(computeFK({ epaule_g: [-180, 0, 0], epaule_d: [-180, 0, 0] }), { type: 'barre', y: 2.2, z: 0 });
  proche((fk.main_g.pos[0] + fk.main_d.pos[0]) / 2, 0);
  proche((fk.main_g.pos[1] + fk.main_d.pos[1]) / 2, 2.2);
  proche((fk.main_g.pos[2] + fk.main_d.pos[2]) / 2, 0);
  assert.ok(fk.pied_g.pos[1] < 2.2 - 1.5);
});

test('ancrer ne modifie pas l\'objet d\'entrée', () => {
  const brut = computeFK({ bassin: [90, 0, 0] });
  const copie = JSON.stringify(brut);
  ancrer(brut, { type: 'sol' });
  ancrer(brut, { type: 'barre', y: 2, z: 0.3 });
  assert.equal(JSON.stringify(brut), copie);
});
