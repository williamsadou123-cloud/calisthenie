import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memoryBackend, createStore, openStore, exportAll, parseImport, importAll } from '../js/storage.js';

const session = (id, date) => ({ id, date, lieu: 'street', titre: 'Tirage', series: [{ exerciceId: 'tractions-pronation', reps: [5, 4, 4] }], terminee: true });

test('test_roundtrip_session', async () => {
  const store = createStore(memoryBackend());
  await store.addSession(session('s1', '2026-11-02'));
  await store.addSession(session('s2', '2026-11-03'));
  const l = await store.listSessions();
  assert.deepEqual(l.map((s) => s.id), ['s2', 's1']); // plus récent d'abord
});

test('addSession avec le même id remplace la séance', async () => {
  const store = createStore(memoryBackend());
  await store.addSession(session('s1', '2026-11-02'));
  await store.addSession({ ...session('s1', '2026-11-02'), terminee: false });
  const l = await store.listSessions();
  assert.equal(l.length, 1);
  assert.equal(l[0].terminee, false);
});

test('profil, paliers, records, réglages: valeurs par défaut puis écriture', async () => {
  const store = createStore(memoryBackend());
  assert.equal(await store.getProfile(), null);
  assert.deepEqual(await store.getValidated(), []);
  assert.deepEqual(await store.getRecords(), {});
  assert.deepEqual(await store.getSettings(), {});
  await store.setProfile({ pompes: { min: 6, max: 10 } });
  await store.setValidated(['a']);
  await store.setRecords({ pompes: 15 });
  await store.setSettings({ debut: '2026-11-02' });
  assert.deepEqual(await store.getProfile(), { pompes: { min: 6, max: 10 } });
  assert.deepEqual(await store.getValidated(), ['a']);
  assert.deepEqual(await store.getRecords(), { pompes: 15 });
  assert.deepEqual(await store.getSettings(), { debut: '2026-11-02' });
});

test('test_export_import_roundtrip', async () => {
  const a = createStore(memoryBackend());
  await a.addSession(session('s1', '2026-11-02'));
  await a.setProfile({ pompes: { min: 6, max: 10 } });
  await a.setValidated(['a', 'b']);
  await a.setRecords({ tractions: 5 });
  await a.setSettings({ debut: '2026-11-02' });
  const texte = await exportAll(a);
  const r = parseImport(texte);
  assert.equal(r.ok, true);
  const b = createStore(memoryBackend());
  await importAll(b, r.donnees);
  assert.deepEqual(await b.listSessions(), await a.listSessions());
  assert.deepEqual(await b.getProfile(), await a.getProfile());
  assert.deepEqual(await b.getValidated(), ['a', 'b']);
  assert.deepEqual(await b.getRecords(), { tractions: 5 });
  assert.deepEqual(await b.getSettings(), { debut: '2026-11-02' });
});

test('test_parse_import_corrompu', () => {
  const cas = [
    'pas du json',
    '',
    '[]',
    '{}',
    JSON.stringify({ version: 99, donnees: {} }),
    JSON.stringify({ version: 1 }),
    JSON.stringify({ version: 1, donnees: { sessions: 'oups' } }),
    JSON.stringify({ version: 1, donnees: { sessions: [], validated: 'x' } }),
    JSON.stringify({ version: 1, donnees: { sessions: [{ id: 1 }] } }),
  ];
  for (const t of cas) {
    const r = parseImport(t);
    assert.equal(r.ok, false, t);
    assert.ok(r.erreur && r.erreur.length > 0);
  }
});

test('test_import_invalide_nefface_pas', async () => {
  const store = createStore(memoryBackend());
  await store.addSession(session('s1', '2026-11-02'));
  const r = parseImport('{"version":1,"donnees":{"sessions":"oups"}}');
  assert.equal(r.ok, false);
  // l'appelant ne doit pas appeler importAll quand ok est faux ; les données restent
  assert.equal((await store.listSessions()).length, 1);
});

test('importAll remplace entièrement les données existantes', async () => {
  const store = createStore(memoryBackend());
  await store.addSession(session('ancienne', '2026-10-01'));
  await importAll(store, { sessions: [session('nouvelle', '2026-11-02')], validated: [], records: {}, settings: {}, profil: null });
  assert.deepEqual((await store.listSessions()).map((s) => s.id), ['nouvelle']);
});

test('test_open_store_fallback', async () => {
  const faux = { open() { throw new Error('indexedDB bloqué'); } };
  const { store, persistant } = await openStore(faux);
  assert.equal(persistant, false);
  await store.addSession(session('s1', '2026-11-02'));
  assert.equal((await store.listSessions()).length, 1);
});

test('openStore sans indexedDB -> mémoire', async () => {
  const { persistant } = await openStore(undefined);
  assert.equal(persistant, false);
});
