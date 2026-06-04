const CACHE_NAME = 'portfolio-vr-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './assets/css/variables.css',
    './assets/css/reset.css',
    './assets/css/layout.css',
    './assets/css/components.css',
    './assets/css/vr-overlay.css',
    './assets/data/profile.json',
    './assets/data/posts/bio.md',
    './assets/data/posts/projects.md',
    './assets/data/posts/contact.md',
    './assets/images/logo.svg',
    './assets/images/skybox/px.jpg',
    './assets/images/skybox/nx.jpg',
    './assets/images/skybox/py.jpg',
    './assets/images/skybox/ny.jpg',
    './assets/images/skybox/pz.jpg',
    './assets/images/skybox/nz.jpg',
    './assets/images/icons/icon-192.png',
    './assets/images/icons/icon-512.png',
    './src/main.js',
    './src/core/App.js',
    './src/core/EventBus.js',
    './src/core/Router.js',
    './src/core/Store.js',
    './src/core/Storage.js',
    './src/vr/WebGLRenderer.js',
    './src/vr/Skybox.js',
    './src/vr/Camera.js',
    './src/parsers/MarkdownParser.js',
    './src/components/BaseComponent.js',
    './src/components/Menu.js',
    './src/components/Settings.js',
    './src/components/Modal.js',
    './src/components/Panel.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return networkResponse;
                });
            })
    );
});
 
