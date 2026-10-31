import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ease, loopPhase, interpolatePose, interpolateLift } from '../js/anim/pose-math.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const proche = (a, b, eps = 0.001) => assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`);

test('three.js 0.160.0 est copié dans vendor/', () => {
  assert.equal(statSync(join(root, 'vendor', 'three', 'three.module.min.js')).size, 670681);
  assert.ok(statSync(join(root, 'vendor', 'three', 'LICENSE')).size > 500);
});

test('ease: bornes, milieu et croissance', () => {
  assert.equal(ease(0), 0);
  assert.equal(ease(1), 1);
  proche(ease(0.5), 0.5);
  let prec = -1;
  for (let i = 0; i <= 20; i++) { const v = ease(i / 20); assert.ok(v > prec); prec = v; }
});

test('loopPhase: aller-retour en mode boucle, constante en mode tenue', () => {
  assert.equal(loopPhase(0, 2, 'boucle'), 0);
  assert.equal(loopPhase(1, 2, 'boucle'), 1);
  assert.equal(loopPhase(2, 2, 'boucle'), 0);
  proche(loopPhase(2.5, 2, 'boucle'), 0.5);
  assert.equal(loopPhase(3, 2, 'boucle'), 1); // sommet de la 2e boucle
  assert.equal(loopPhase(9, 2, 'tenue'), 1);
});

test('interpolatePose: extrémités, milieu, articulation absente, phase bornée', () => {
  const poses = [
    { t: 0, joints: { coude_g: [0, 0, 0] } },
    { t: 1, joints: { coude_g: [-90, 0, 0], genou_g: [40, 0, 0] } },
  ];
  assert.deepEqual(interpolatePose(poses, 0).coude_g, [0, 0, 0]);
  assert.deepEqual(interpolatePose(poses, 1).coude_g, [-90, 0, 0]);
  proche(interpolatePose(poses, 0.5).coude_g[0], -45);
  assert.deepEqual(interpolatePose(poses, 0).genou_g, [0, 0, 0]); // absent de la pose 0
  proche(interpolatePose(poses, 0.5).genou_g[0], 20);
  assert.deepEqual(interpolatePose(poses, -3).coude_g, [0, 0, 0]);
  assert.deepEqual(interpolatePose(poses, 7).coude_g, [-90, 0, 0]);
});

test('interpolatePose: trois poses clés, passe par la pose du milieu', () => {
  const poses = [
    { t: 0, joints: { coude_d: [0, 0, 0] } },
    { t: 0.5, joints: { coude_d: [-100, 0, 0] } },
    { t: 1, joints: { coude_d: [0, 0, 0] } },
  ];
  proche(interpolatePose(poses, 0.5).coude_d[0], -100);
  proche(interpolatePose(poses, 0.25).coude_d[0], -50);
});

test('interpolateLift: 0 par défaut, interpolé entre les poses qui en ont un', () => {
  const sans = [{ t: 0, joints: {} }, { t: 1, joints: {} }];
  assert.equal(interpolateLift(sans, 0.5), 0);
  const avec = [{ t: 0, joints: {}, lift: 0 }, { t: 1, joints: {}, lift: 0.45 }];
  assert.equal(interpolateLift(avec, 0), 0);
  assert.equal(interpolateLift(avec, 1), 0.45);
  proche(interpolateLift(avec, 0.5), 0.225);
  const mixte = [{ t: 0, joints: {} }, { t: 1, joints: {}, lift: 0.4 }];
  proche(interpolateLift(mixte, 0.5), 0.2);
});
