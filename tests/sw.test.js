import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
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
