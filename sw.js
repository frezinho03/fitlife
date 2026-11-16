// Service worker: l'app funziona offline. Cambia VERSION quando aggiorni i file per forzare l'aggiornamento.
const VERSION = 'fitlife-v8';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/app.js', 'js/ui.js', 'js/logic.js', 'js/data.js', 'js/art.js', 'js/store.js', 'js/body.js', 'js/exinfo.js', 'js/plan.js', 'js/extra.js', 'js/season.js', 'js/catalog.js',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Stale-while-revalidate: risponde subito dalla cache e aggiorna in background.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    return cached || (await network) || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
  }));
});
