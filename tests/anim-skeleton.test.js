import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOINTS, ZONES_MUSCLES, PROPORTIONS, computeFK } from '../js/anim/skeleton.js';

const proche = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b} (±${eps})`);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const tousLesPoints = (fk) => Object.values(fk).map((p) => p.pos);

test('17 articulations distinctes et 10 zones musculaires', () => {
  assert.equal(JOINTS.length, 17);
  assert.equal(new Set(JOINTS).size, 17);
  assert.equal(ZONES_MUSCLES.length, 10);
});

test('repos: taille de 1,75 m, mains le long du corps', () => {
  const fk = computeFK({});
  const bas = Math.min(...tousLesPoints(fk).map((p) => p[1]));
  proche(fk.sommet_tete.pos[1] - bas, 1.75, 0.03);
  proche(fk.main_g.pos[0], fk.epaule_g.pos[0], 0.001);
  assert.ok(fk.main_g.pos[1] < fk.epaule_g.pos[1] - 0.65);
});

test('repos: symétrie gauche/droite', () => {
  const fk = computeFK({});
  for (const n of ['epaule', 'coude', 'poignet', 'hanche', 'genou', 'cheville']) {
    const g = fk[`${n}_g`].pos;
    const d = fk[`${n}_d`].pos;
    proche(g[0], -d[0], 0.0001);
    proche(g[1], d[1], 0.0001);
    proche(g[2], d[2], 0.0001);
  }
});

test('mêmes angles à gauche et à droite = pose en miroir', () => {
  const fk = computeFK({
    epaule_g: [-40, 20, 70], epaule_d: [-40, 20, 70],
    coude_g: [-60, 0, 0], coude_d: [-60, 0, 0],
    hanche_g: [-30, 10, 15], hanche_d: [-30, 10, 15],
  });
  for (const n of ['coude', 'poignet', 'genou', 'cheville']) {
    const g = fk[`${n}_g`].pos;
    const d = fk[`${n}_d`].pos;
    proche(g[0], -d[0], 0.0001);
    proche(g[1], d[1], 0.0001);
    proche(g[2], d[2], 0.0001);
  }
});

test('hanche à -90°: le genou passe devant le bassin, à hauteur de hanche', () => {
  const fk = computeFK({ hanche_g: [-90, 0, 0] });
  proche(fk.genou_g.pos[2] - fk.hanche_g.pos[2], PROPORTIONS.cuisse, 0.001);
  proche(fk.genou_g.pos[1], fk.hanche_g.pos[1], 0.001);
});

test('genou fléchi à 150°: la cheville passe derrière le genou', () => {
  const fk = computeFK({ hanche_g: [-90, 0, 0], genou_g: [150, 0, 0] });
  assert.ok(fk.cheville_g.pos[2] < fk.genou_g.pos[2] - 0.1);
});

test('épaule: abduction à 90° et bras levé à -180°', () => {
  const lateral = computeFK({ epaule_g: [0, 0, 90] });
  proche(lateral.coude_g.pos[0], lateral.epaule_g.pos[0] + PROPORTIONS.bras, 0.001);
  proche(lateral.coude_g.pos[1], lateral.epaule_g.pos[1], 0.001);
  const leve = computeFK({ epaule_g: [-180, 0, 0] });
  assert.ok(leve.main_g.pos[1] > leve.sommet_tete.pos[1]);
});

test('coude fléchi à -90°: l\'avant-bras part vers l\'avant', () => {
  const fk = computeFK({ coude_g: [-90, 0, 0] });
  proche(fk.poignet_g.pos[2] - fk.coude_g.pos[2], PROPORTIONS.avantBras, 0.001);
});

test('bassin à +90°: corps à plat, face au sol, tête devant', () => {
  const fk = computeFK({ bassin: [90, 0, 0] });
  proche(fk.sommet_tete.pos[2], 0.8, 0.05);
  assert.ok(Math.abs(fk.sommet_tete.pos[1] - fk.bassin.pos[1]) < 0.05);
  assert.ok(fk.pied_g.pos[2] < -0.9); // pieds derrière
  // le devant du corps (+z au repos) regarde le sol: rot * (0,0,1) = (0,-1,0)
  const r = fk.bassin.rot;
  proche(r[1 * 3 + 2], -1, 0.001);
});

test('longueurs d\'os conservées dans une pose quelconque', () => {
  const fk = computeFK({
    bassin: [33, -20, 15], poitrine: [10, 25, -5], epaule_g: [-70, 30, 50], coude_g: [-120, 0, 0],
    hanche_d: [-60, 5, 12], genou_d: [100, 0, 0], cou: [15, -10, 0],
  });
  proche(dist(fk.coude_g.pos, fk.epaule_g.pos), PROPORTIONS.bras, 0.0001);
  proche(dist(fk.poignet_g.pos, fk.coude_g.pos), PROPORTIONS.avantBras, 0.0001);
  proche(dist(fk.genou_d.pos, fk.hanche_d.pos), PROPORTIONS.cuisse, 0.0001);
  proche(dist(fk.cheville_d.pos, fk.genou_d.pos), PROPORTIONS.tibia, 0.0001);
});
