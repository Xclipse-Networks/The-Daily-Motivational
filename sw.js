const CACHE_NAME = 'sovereign-v1';
const ASSETS = [
  './',
  './index.html',
  './portal-engine.js',
  './manifest.json',
  './logo.png'
];

// Install: Cache UI Assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Fetch: Serve from Cache, fall back to Network
self.addEventListener('fetch', (e) => {
  // Don't cache the RSS API calls to ensure fresh episodes
  if (e.request.url.includes('rss2json')) {
    return fetch(e.request);
  }
  
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});