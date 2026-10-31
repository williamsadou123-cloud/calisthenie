import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { illustration, ILLUSTRATIONS } from '../js/illustrations.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const exercices = JSON.parse(readFileSync(join(root, 'data', 'exercices.json'), 'utf8'));

test('test_toutes_les_illustrations_existent', () => {
  for (const e of exercices) {
    assert.ok(ILLUSTRATIONS[e.illustration], `${e.id}: illustration "${e.illustration}" manquante`);
    const svg = illustration(e.illustration);
    assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
    assert.notEqual(svg, illustration('inconnu'), `${e.id}: illustration neutre`);
  }
});

test('illustration inconnue -> SVG neutre sans erreur', () => {
  assert.match(illustration('inconnu'), /^<svg/);
  assert.match(illustration(undefined), /^<svg/);
});

test('les illustrations sont des SVG bien formés (balises équilibrées)', () => {
  for (const [k, v] of Object.entries(ILLUSTRATIONS)) {
    const svg = illustration(k);
    for (const tag of ['circle', 'line', 'polyline', 'path', 'g']) {
      const ouvre = (svg.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
      const ferme = (svg.match(new RegExp(`</${tag}>`, 'g')) || []).length + (svg.match(new RegExp(`<${tag}[^>]*/>`, 'g')) || []).length;
      assert.equal(ouvre, ferme, `${k}: <${tag}> non équilibré`);
    }
    assert.ok(v.length > 20, k);
  }
});
