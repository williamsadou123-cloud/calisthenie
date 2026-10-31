import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chargerFacultatif } from '../js/chargement.js';

const reponse = (ok, corps) => ({ ok, json: async () => { if (corps instanceof Error) throw corps; return corps; } });

test('chargerFacultatif: renvoie le JSON quand le fichier est là', async () => {
  const f = async () => reponse(true, { a: 1 });
  assert.deepEqual(await chargerFacultatif(f, 'data/x.json'), { a: 1 });
});

test('chargerFacultatif: renvoie null (sans exception) si le fichier manque, est mal formé ou si le réseau échoue', async () => {
  assert.equal(await chargerFacultatif(async () => reponse(false, {}), 'data/x.json'), null);
  assert.equal(await chargerFacultatif(async () => reponse(true, new SyntaxError('json')), 'data/x.json'), null);
  assert.equal(await chargerFacultatif(async () => { throw new TypeError('réseau'); }, 'data/x.json'), null);
});
