// Network-first: always try the network so deploys show up immediately.
// Only fall back to the runtime cache when the network is unavailable
// (offline), rather than precaching specific dev-mode file paths that
// don't match the hashed filenames Vite produces in a production build.
const CACHE_NAME = 'mise-cache-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Never cache API calls, the Swiggy relay or the Swiggy sign-in callback.
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin &&
      (url.pathname.startsWith('/api/') || url.pathname.startsWith('/swiggy'))) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
