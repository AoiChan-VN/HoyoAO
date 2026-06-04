const CACHE_NAME = 'portfolio-vr-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/variables.css',
  './assets/css/main.css',
  './assets/icons/app-icon.svg',
  './data/settings.json',
  './data/portfolio.json',
  './src/app.js',
  './src/core/event-bus.js',
  './src/core/store.js',
  './src/core/router.js',
  './src/vr/camera-matrix.js',
  './src/vr/webgl-renderer.js',
  './src/parser/markdown-parser.js',
  './src/components/base-component.js',
  './src/components/menu-panel.js',
  './src/components/settings-panel.js',
  './src/components/content-modal.js',
  './assets/images/skybox/px.webp',
  './assets/images/skybox/nx.webp',
  './assets/images/skybox/py.webp',
  './assets/images/skybox/ny.webp',
  './assets/images/skybox/pz.webp',
  './assets/images/skybox/nz.webp'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      const len = keys.length;
      const promises = [];
      for (let i = 0; i < len; i++) {
        if (keys[i] !== CACHE_NAME) {
          promises.push(caches.delete(keys[i]));
        }
      }
      return Promise.all(promises);
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
