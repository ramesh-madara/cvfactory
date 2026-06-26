const CACHE_VERSION = 'cvfactory-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

const SHELL_FILES = new Set([
  'index.html',
  'app.js',
  'data.js',
  'pwa.js',
  'manifest.webmanifest',
  'offline.html',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'favicon.png',
]);

function isShellAsset(pathname) {
  const file = pathname.split('/').pop() || '';
  return SHELL_FILES.has(file) || pathname.endsWith('/');
}

function cacheKey(pathname) {
  const file = pathname.split('/').pop() || 'index.html';
  return SHELL_FILES.has(file) ? `./${file}` : pathname;
}

function isMediaRequest(url) {
  return /\/(cvs|customerFeedback)\/[^/]+\.(jpe?g|png|webp|gif|mp4)$/i.test(url.pathname);
}

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        cache.addAll([
          './',
          './index.html',
          './app.js',
          './data.js',
          './pwa.js',
          './manifest.webmanifest',
          './offline.html',
          './favicon.png',
          './icons/icon.svg',
          './icons/icon-192.png',
          './icons/icon-512.png',
        ])
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith('cvfactory-') && key !== SHELL_CACHE && key !== IMAGE_CACHE).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || !isSameOrigin(new URL(request.url))) {
    return;
  }

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html').then((cached) => cached || caches.match('./offline.html')))
    );
    return;
  }

  if (isMediaRequest(url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);

        return cached || network;
      })
    );
    return;
  }

  if (isShellAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((response) => {
          if (response.ok) {
            const key = cacheKey(url.pathname);
            caches.open(SHELL_CACHE).then((cache) => cache.put(key, response.clone()));
          }
          return response;
        });
        return cached || network;
      })
    );
  }
});
