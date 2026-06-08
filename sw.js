const CACHE_NAME = 'retorno-v16';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/tailwind.css',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/scripts/app.js',
  '/scripts/state.js',
  '/scripts/dom.js',
  '/scripts/navigation.js',
  '/scripts/validation.js',
  '/scripts/iniciais.js',
  '/scripts/retornos.js',
  '/scripts/equipment.js',
  '/scripts/attachments.js',
  '/scripts/email.js',
  '/scripts/send.js',
  '/scripts/compress.js',
  '/scripts/reset.js',
  '/scripts/restore.js',
  '/scripts/sidebar.js',
  '/scripts/ui.js',
  '/scripts/db.js',
  '/scripts/utils.js',
  '/scripts/duplicate.js',
  '/scripts/fields.js',
  '/scripts/sw-update.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.url.includes('/api/')) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});
