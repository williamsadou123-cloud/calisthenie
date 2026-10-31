import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assets() {
  const src = readFileSync(join(root, 'sw.js'), 'utf8');
  const m = src.match(/const ASSETS = \[([\s\S]*?)\];/);
  assert.ok(m, 'ASSETS introuvable dans sw.js');
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

test('test_assets_exist', () => {
  const list = assets();
  for (const f of ['index.html', 'manifest.json', 'data/exercices.json', 'data/programme.json', 'data/figures.json']) {
    assert.ok(list.includes(f), `${f} absent de ASSETS`);
  }
  for (const f of list) {
    if (f === './') continue;
    assert.ok(existsSync(join(root, f)), `${f} n'existe pas sur disque`);
  }
});

test('cache_name_defini', () => {
  const src = readFileSync(join(root, 'sw.js'), 'utf8');
  assert.match(src, /const CACHE_NAME = 'calisthenie-v\d+'/);
});

test('tous les fichiers des animations (js/anim, vendor, données) sont dans ASSETS pour le hors-ligne', () => {
  const src = readFileSync(join(root, 'sw.js'), 'utf8');
  const m = src.match(/const ASSETS = \[([\s\S]*?)\];/);
  const list = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  const attendus = [
    ...readdirSync(join(root, 'js', 'anim')).map((f) => `js/anim/${f}`),
    'vendor/three/three.module.min.js',
    'data/animations.json',
    'js/chargement.js',
  ];
  for (const f of attendus) assert.ok(list.includes(f), `${f} absent de ASSETS`);
});
