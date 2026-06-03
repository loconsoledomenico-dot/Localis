const CACHE_VERSION = 'v2';
const AUDIO_CACHE = `localis-audio-${CACHE_VERSION}`;
const STATIC_CACHE = `localis-static-${CACHE_VERSION}`;
const OFFLINE_INDEX_KEY = 'localis::offline-index';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(['/', '/offline.html', '/favicon.svg']).catch(() => {}),
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

  // Guide audio on R2 — serve from cache if saved offline, else stream from network
  if (url.hostname.endsWith('.r2.cloudflarestorage.com')) {
    event.respondWith(handleGuideAudio(event.request));
    return;
  }

  // Trailers — cache automatically on first fetch (small files)
  if (url.pathname.startsWith('/audio/trailers/')) {
    event.respondWith(handleTrailerAudio(event.request));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html')),
    );
    return;
  }

  if (
    url.pathname.startsWith('/_astro/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname === '/favicon.svg'
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached ||
        fetch(event.request).then((response) => {
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

// Guide audio: serve from offline cache (keyed by pathname) with Range support.
// Never caches automatically — only via explicit SAVE_OFFLINE message.
async function handleGuideAudio(request) {
  const url = new URL(request.url);
  const cacheKey = new Request(`localis::audio-path::${url.pathname}`);

  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(cacheKey);

  if (cached) {
    const rangeHeader = request.headers.get('Range');
    if (rangeHeader) {
      return serveRange(cached, rangeHeader);
    }
    return cached.clone();
  }

  // Not saved offline — stream from network
  try {
    return await fetch(request);
  } catch {
    return new Response('Audio non disponibile offline. Salva la guida prima di partire.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

// Trailers: cache-first, auto-cache on first fetch
async function handleTrailerAudio(request) {
  const cacheKey = new Request(new URL(request.url).pathname, { headers: {} });
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(cacheKey);

  if (cached) {
    const rangeHeader = request.headers.get('Range');
    if (rangeHeader) return serveRange(cached, rangeHeader);
    return cached.clone();
  }

  try {
    const response = await fetch(request);
    if (response.ok && response.status === 200) {
      cache.put(cacheKey, response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    const fallback = await cache.match(cacheKey);
    if (fallback) return fallback;
    throw err;
  }
}

// Serve a Range request from a fully-cached Response
async function serveRange(cachedResponse, rangeHeader) {
  const buffer = await cachedResponse.arrayBuffer();
  const total = buffer.byteLength;

  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!match) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${total}` },
    });
  }

  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : total - 1;
  const clampedEnd = Math.min(end, total - 1);

  if (start > clampedEnd || start >= total) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${total}` },
    });
  }

  const slice = buffer.slice(start, clampedEnd + 1);

  return new Response(slice, {
    status: 206,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Range': `bytes ${start}-${clampedEnd}/${total}`,
      'Content-Length': String(clampedEnd - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

// Offline index: maps "slug::lang" → { pathname, savedAt, size }
async function getOfflineIndex() {
  const cache = await caches.open(AUDIO_CACHE);
  const res = await cache.match(new Request(OFFLINE_INDEX_KEY));
  if (!res) return {};
  return res.json().catch(() => ({}));
}

async function saveOfflineIndex(index) {
  const cache = await caches.open(AUDIO_CACHE);
  await cache.put(
    new Request(OFFLINE_INDEX_KEY),
    new Response(JSON.stringify(index), {
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

self.addEventListener('message', (event) => {
  const { data, source } = event;

  if (data?.type === 'SAVE_OFFLINE') {
    handleSaveOffline(data, source);
    return;
  }

  if (data?.type === 'GET_OFFLINE_STATUS') {
    handleGetStatus(data, source);
    return;
  }

  if (data?.type === 'DELETE_OFFLINE') {
    handleDeleteOffline(data, source);
    return;
  }
});

async function handleGetStatus(data, source) {
  const { slug, lang } = data;
  const index = await getOfflineIndex();
  const entry = index[`${slug}::${lang}`];
  source.postMessage({
    type: 'OFFLINE_STATUS',
    slug,
    lang,
    available: Boolean(entry),
    size: entry?.size || 0,
  });
}

async function handleDeleteOffline(data, source) {
  const { slug, lang } = data;
  const index = await getOfflineIndex();
  const entry = index[`${slug}::${lang}`];
  if (entry?.pathname) {
    const cache = await caches.open(AUDIO_CACHE);
    await cache.delete(new Request(`localis::audio-path::${entry.pathname}`));
  }
  delete index[`${slug}::${lang}`];
  await saveOfflineIndex(index);
  source.postMessage({ type: 'OFFLINE_DELETED', slug, lang });
}

async function handleSaveOffline(data, source) {
  const { url, slug, lang } = data;

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok || !response.body) {
      source.postMessage({
        type: 'OFFLINE_ERROR',
        slug,
        lang,
        message: `HTTP ${response.status}`,
      });
      return;
    }

    const total = parseInt(response.headers.get('Content-Length') || '0', 10);
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    let lastPct = -1;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;

      if (total > 0) {
        const pct = Math.floor((received / total) * 100);
        if (pct !== lastPct) {
          lastPct = pct;
          source.postMessage({ type: 'OFFLINE_PROGRESS', slug, lang, percent: pct });
        }
      }
    }

    // Assemble
    const full = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      full.set(chunk, offset);
      offset += chunk.byteLength;
    }

    // Store keyed by R2 pathname (stable for same user+guide+lang)
    const pathname = new URL(url).pathname;
    const cacheKey = new Request(`localis::audio-path::${pathname}`);
    const audioResponse = new Response(full.buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(received),
        'Accept-Ranges': 'bytes',
      },
    });

    const cache = await caches.open(AUDIO_CACHE);
    await cache.put(cacheKey, audioResponse);

    // Update index
    const index = await getOfflineIndex();
    index[`${slug}::${lang}`] = { pathname, savedAt: Date.now(), size: received };
    await saveOfflineIndex(index);

    source.postMessage({ type: 'OFFLINE_DONE', slug, lang, size: received });
  } catch (err) {
    source.postMessage({
      type: 'OFFLINE_ERROR',
      slug,
      lang,
      message: err instanceof Error ? err.message : 'Download fallito',
    });
  }
}
