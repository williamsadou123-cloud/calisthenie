const VERSION = 1;
const CLES = { sessions: [], profil: null, validated: [], records: {}, settings: {} };

export function memoryBackend() {
  const m = new Map();
  return {
    async get(k) { return m.has(k) ? structuredClone(m.get(k)) : undefined; },
    async put(k, v) { m.set(k, structuredClone(v)); },
    async keys() { return [...m.keys()]; },
    async clear() { m.clear(); },
  };
}

export function idbBackend(dbName, idb = globalThis.indexedDB) {
  return new Promise((resolve, reject) => {
    let req;
    try { req = idb.open(dbName, 1); } catch (e) { reject(e); return; }
    req.onupgradeneeded = () => req.result.createObjectStore('kv');
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB bloqué'));
    req.onsuccess = () => {
      const db = req.result;
      const tx = (mode, fn) => new Promise((res, rej) => {
        const t = db.transaction('kv', mode);
        const r = fn(t.objectStore('kv'));
        t.oncomplete = () => res(r.result);
        t.onerror = () => rej(t.error);
        t.onabort = () => rej(t.error);
      });
      resolve({
        get: (k) => tx('readonly', (s) => s.get(k)),
        put: (k, v) => tx('readwrite', (s) => s.put(v, k)).then(() => undefined),
        keys: () => tx('readonly', (s) => s.getAllKeys()),
        clear: () => tx('readwrite', (s) => s.clear()).then(() => undefined),
      });
    };
  });
}

export function createStore(backend) {
  const lire = async (k) => {
    const v = await backend.get(k);
    return v === undefined ? structuredClone(CLES[k]) : v;
  };
  return {
    async addSession(session) {
      const l = (await lire('sessions')).filter((s) => s.id !== session.id);
      l.push(session);
      await backend.put('sessions', l);
    },
    async listSessions() {
      const l = await lire('sessions');
      return l.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    },
    getProfile: () => lire('profil'),
    setProfile: (p) => backend.put('profil', p),
    getValidated: () => lire('validated'),
    setValidated: (v) => backend.put('validated', v),
    getRecords: () => lire('records'),
    setRecords: (r) => backend.put('records', r),
    getSettings: () => lire('settings'),
    setSettings: (s) => backend.put('settings', s),
    async replaceAll(donnees) {
      await backend.clear();
      for (const k of Object.keys(CLES)) await backend.put(k, donnees[k]);
    },
    async snapshot() {
      const out = {};
      for (const k of Object.keys(CLES)) out[k] = await lire(k);
      out.sessions = await this.listSessions();
      return out;
    },
  };
}

export async function openStore(idb = globalThis.indexedDB) {
  try {
    if (!idb) throw new Error('IndexedDB indisponible');
    const backend = await idbBackend('calisthenie', idb);
    await backend.put('__test', 1); // détecte un stockage en lecture seule / bloqué
    return { store: createStore(backend), persistant: true };
  } catch {
    return { store: createStore(memoryBackend()), persistant: false };
  }
}

const estObjet = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

function valider(donnees) {
  if (!estObjet(donnees)) return 'Le fichier ne contient pas de données.';
  const d = { ...structuredClone(CLES), ...donnees };
  if (!Array.isArray(d.sessions) || !d.sessions.every((s) => estObjet(s) && typeof s.id === 'string' && typeof s.date === 'string')) {
    return 'La liste des séances est invalide.';
  }
  if (!Array.isArray(d.validated) || !d.validated.every((x) => typeof x === 'string')) return 'Les paliers validés sont invalides.';
  if (!estObjet(d.records)) return 'Les records sont invalides.';
  if (!estObjet(d.settings)) return 'Les réglages sont invalides.';
  if (d.profil !== null && !estObjet(d.profil)) return 'Le profil est invalide.';
  return { ok: d };
}

export async function exportAll(store) {
  return JSON.stringify({ version: VERSION, exporteLe: new Date().toISOString(), donnees: await store.snapshot() }, null, 1);
}

export function parseImport(text) {
  let obj;
  try { obj = JSON.parse(text); } catch { return { ok: false, erreur: 'Ce fichier n\'est pas une sauvegarde valide (JSON illisible).' }; }
  if (!estObjet(obj)) return { ok: false, erreur: 'Ce fichier n\'est pas une sauvegarde de l\'appli.' };
  if (obj.version !== VERSION) return { ok: false, erreur: `Version de sauvegarde non prise en charge (${obj.version ?? 'absente'}).` };
  if (!('donnees' in obj)) return { ok: false, erreur: 'La sauvegarde ne contient pas de données.' };
  const v = valider(obj.donnees);
  if (typeof v === 'string') return { ok: false, erreur: v };
  return { ok: true, donnees: v.ok };
}

export async function importAll(store, donnees) {
  const v = valider(donnees);
  if (typeof v === 'string') throw new Error(v); // jamais d'écriture partielle
  await store.replaceAll(v.ok);
}
