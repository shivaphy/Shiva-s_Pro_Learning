const CACHE_NAME = 'brisklearn-v1.2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/db.js',
  '/js/emailjs.js',
  '/js/lang.js',
  '/js/pdf-export.js',
  '/js/pwa.js',
  '/manifest.json'
];

// Install — cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network-first for API, cache-first for assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET and cross-origin API calls (Anthropic, EmailJS)
  if (e.request.method !== 'GET') return;
  if (url.hostname === 'api.anthropic.com' || url.hostname.includes('emailjs')) return;

  // Cache-first for static assets
  if (STATIC_ASSETS.some(a => url.pathname.endsWith(a.replace('/',''))) || url.pathname === '/') {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  // Network-first for everything else
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Background sync for offline quiz submissions
self.addEventListener('sync', e => {
  if (e.tag === 'sync-submissions') {
    e.waitUntil(syncOfflineSubmissions());
  }
});

async function syncOfflineSubmissions() {
  // Notify all clients that sync is happening
  const clients = await self.clients.matchAll();
  clients.forEach(c => c.postMessage({ type: 'SYNC_START' }));
  // actual sync handled in app.js via IndexedDB
}
