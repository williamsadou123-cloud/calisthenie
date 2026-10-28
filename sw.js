const CACHE_NAME = 'calisthenie-v1';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'manifest.json',
  'js/main.js',
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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((hit) => {
      if (hit) return hit;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('index.html');
        return Response.error();
      });
    }),
  );
});
