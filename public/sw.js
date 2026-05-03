const CACHE_VERSION = 'v1';
const AUDIO_CACHE = `localis-audio-${CACHE_VERSION}`;
const STATIC_CACHE = `localis-static-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll([
        '/',
        '/offline.html',
        '/favicon.svg',
      ]).catch(() => {}),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== AUDIO_CACHE && k !== STATIC_CACHE)
            .map((k) => caches.delete(k)),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.hostname.endsWith('.r2.cloudflarestorage.com')) {
    event.respondWith(handleAudio(event.request));
    return;
  }

  if (url.pathname.startsWith('/audio/trailers/')) {
    event.respondWith(handleAudio(event.request));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html')),
    );
    return;
  }

  if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/images/') || url.pathname === '/favicon.svg') {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(event.request, clone));
          }
          return response;
        }),
      ),
    );
    return;
  }
});

async function handleAudio(request) {
  const url = new URL(request.url);
  const cacheKey = `${url.origin}${url.pathname}`;
  const cacheKeyRequest = new Request(cacheKey);

  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(cacheKeyRequest);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok && response.status === 200) {
      const clone = response.clone();
      cache.put(cacheKeyRequest, clone).catch(() => {});
    }
    return response;
  } catch (err) {
    const fallback = await cache.match(cacheKeyRequest);
    if (fallback) return fallback;
    throw err;
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'PRECACHE_AUDIO' && event.data.url) {
    caches.open(AUDIO_CACHE).then(async (cache) => {
      try {
        const response = await fetch(event.data.url);
        if (response.ok) {
          const url = new URL(event.data.url);
          const cacheKey = new Request(`${url.origin}${url.pathname}`);
          await cache.put(cacheKey, response);
        }
      } catch {
        // ignore
      }
    });
  }
});
