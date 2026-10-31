const CACHE_NAME = 'calisthenie-v1';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'manifest.json',
  'js/main.js',
  'js/progression.js',
  'js/program.js',
  'js/figures.js',
  'js/timer.js',
  'js/storage.js',
  'js/dom.js',
  'js/feedback.js',
  'js/illustrations.js',
  'js/views/aujourdhui.js',
  'js/views/seance.js',
  'js/views/exercices.js',
  'js/views/figures.js',
  'js/views/progres.js',
  'js/views/depart.js',
  'data/exercices.json',
  'data/programme.json',
  'data/figures.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function prevenirMiseAJour() {
  for (const c of await self.clients.matchAll()) c.postMessage({ type: 'maj' });
}

// Cache d'abord (fonctionne sans réseau), puis mise à jour en arrière-plan quand le réseau répond.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(req);
    const reseau = fetch(req)
      .then(async (res) => {
        if (res.ok) {
          const avant = hit && (hit.headers.get('etag') || hit.headers.get('last-modified'));
          const apres = res.headers.get('etag') || res.headers.get('last-modified');
          await cache.put(req, res.clone());
          if (hit && avant !== apres) await prevenirMiseAJour();
        }
        return res;
      })
      .catch(() => null);
    if (hit) { event.waitUntil(reseau); return hit; }
    const res = await reseau;
    if (res) return res;
    if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
    return Response.error();
  })());
});
