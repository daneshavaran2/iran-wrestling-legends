const CACHE_VERSION = 'v3';
const STATIC_CACHE = `iran-wrestling-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `iran-wrestling-dynamic-${CACHE_VERSION}`;
const API_CACHE = `iran-wrestling-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `iran-wrestling-images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.json',
  '/placeholder.svg',
  '/fonts/Vazirmatn-Regular.woff2',
  '/fonts/Vazirmatn-Bold.woff2',
  '/fonts/Vazirmatn-Medium.woff2',
  '/fonts/Vazirmatn-Light.woff2',
];

// Maximum cache sizes
const MAX_API_CACHE_SIZE = 100;
const MAX_IMAGE_CACHE_SIZE = 300;
const MAX_DYNAMIC_CACHE_SIZE = 50;

// Cache duration in milliseconds
const API_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const IMAGE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Helper: Limit cache size
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxSize) {
    const deleteCount = keys.length - maxSize;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Helper: Check if response is cacheable
function isCacheable(response) {
  return response && response.status === 200 && response.type !== 'opaque';
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('iran-wrestling-') && 
                   !name.endsWith(CACHE_VERSION);
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // Handle Supabase API calls - Stale While Revalidate
  if (url.hostname.includes('supabase')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle images - Cache First with network fallback
  if (request.destination === 'image' || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(url.pathname)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle fonts - Cache First (long-term)
  if (request.destination === 'font' || /\.(woff2?|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(handleFontRequest(request));
    return;
  }

  // Handle static assets - Cache First
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle navigation requests - Network First with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Default: Network First for other requests
  event.respondWith(handleDynamicRequest(request));
});

// Stale While Revalidate for API
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(async (networkResponse) => {
      if (isCacheable(networkResponse)) {
        const responseToCache = networkResponse.clone();
        await cache.put(request, responseToCache);
        await limitCacheSize(API_CACHE, MAX_API_CACHE_SIZE);
      }
      return networkResponse;
    })
    .catch(() => {
      // Return cached response if network fails
      return cachedResponse || new Response(
        JSON.stringify({ error: 'آفلاین - داده‌ها از کش بارگذاری شد' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

  // Return cached response immediately, update in background
  return cachedResponse || fetchPromise;
}

// Cache First for images
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (isCacheable(networkResponse)) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      await limitCacheSize(IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE);
    }
    return networkResponse;
  } catch (error) {
    // Return placeholder for failed images
    return caches.match('/placeholder.svg');
  }
}

// Cache First for fonts (long-term caching)
async function handleFontRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (isCacheable(networkResponse)) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('', { status: 503 });
  }
}

// Cache First for static assets
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (isCacheable(networkResponse)) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return caches.match('/');
  }
}

// Network First for navigation
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    if (isCacheable(networkResponse)) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return cached index for SPA
    return caches.match('/');
  }
}

// Network First for dynamic content
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (isCacheable(networkResponse)) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('آفلاین', { status: 503 });
  }
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  // Clear all caches
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }

  // Pre-cache wrestler images
  if (event.data.type === 'CACHE_IMAGES') {
    const urls = event.data.urls;
    event.waitUntil(
      caches.open(IMAGE_CACHE).then((cache) => {
        return Promise.all(
          urls.map((url) =>
            fetch(url)
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(() => {})
          )
        );
      })
    );
  }

  // Pre-cache specific URLs
  if (event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls;
    const cacheName = event.data.cacheName || DYNAMIC_CACHE;
    event.waitUntil(
      caches.open(cacheName).then((cache) => {
        return cache.addAll(urls);
      })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implement background sync logic if needed
  console.log('[SW] Background sync triggered');
}
