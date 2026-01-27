const CACHE_VERSION = 'v4';
const STATIC_CACHE = `iran-wrestling-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `iran-wrestling-dynamic-${CACHE_VERSION}`;
const API_CACHE = `iran-wrestling-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `iran-wrestling-images-${CACHE_VERSION}`;

// Supabase configuration
const SUPABASE_URL = 'https://etbekvhdroqiddcteqdq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0YmVrdmhkcm9xaWRkY3RlcWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjU4MTUsImV4cCI6MjA4Mjk0MTgxNX0.cDiwofOdALtJ349janVwJtuItIRwvY3DC8ihO0rmlPU';

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

// API endpoints to sync
const SYNC_ENDPOINTS = [
  'wrestlers?select=*&is_visible=eq.true',
  'achievements?select=*',
  'wrestler_media?select=*',
  'history_sections?select=*',
  'buildings?select=*',
  'books?select=*',
  'albums?select=*',
  'album_photos?select=*',
  'about_media?select=*',
  'app_settings?select=*',
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

// Helper: Notify all clients
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
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

// Activate event - clean old caches, enable navigation preload, and notify clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Enable navigation preload for faster page loads
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
          console.log('[SW] Navigation preload enabled');
        } catch (err) {
          console.log('[SW] Navigation preload not supported');
        }
      }
      
      // Clean old caches
      const cacheNames = await caches.keys();
      await Promise.all(
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
      
      // Notify all clients about update
      await notifyClients({ type: 'SW_UPDATED' });
    })()
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
  // Skip waiting and activate new service worker
  if (event.data === 'skipWaiting' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Clear all caches
  if (event.data?.type === 'CLEAR_CACHE' || event.data?.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        ).then(() => {
          // Notify client that caches are cleared
          if (event.source) {
            event.source.postMessage({ type: 'CACHES_CLEARED' });
          }
        });
      })
    );
  }

  // Pre-cache wrestler images
  if (event.data?.type === 'CACHE_IMAGES') {
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
  if (event.data?.type === 'CACHE_URLS') {
    const urls = event.data.urls;
    const cacheName = event.data.cacheName || DYNAMIC_CACHE;
    event.waitUntil(
      caches.open(cacheName).then((cache) => {
        return cache.addAll(urls);
      })
    );
  }

  // Get cache status
  if (event.data?.type === 'GET_CACHE_STATUS') {
    event.waitUntil(
      (async () => {
        const cacheNames = await caches.keys();
        const status = {};
        
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          status[name] = keys.length;
        }
        
        if (event.source) {
          event.source.postMessage({ 
            type: 'CACHE_STATUS', 
            status 
          });
        }
      })()
    );
  }

  // Trigger manual background sync
  if (event.data?.type === 'TRIGGER_SYNC') {
    event.waitUntil(syncMuseumData());
  }
});

// Background Sync event handler
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event received:', event.tag);
  
  if (event.tag === 'sync-museum-data') {
    event.waitUntil(syncMuseumData());
  }
  
  if (event.tag === 'sync-images') {
    event.waitUntil(syncImages());
  }
});

// Periodic Background Sync event handler (for supported browsers)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event received:', event.tag);
  
  if (event.tag === 'museum-data-sync') {
    event.waitUntil(syncMuseumData());
  }
});

// Sync all museum data from Supabase
async function syncMuseumData() {
  console.log('[SW] Background sync: Starting museum data sync');
  
  // Notify clients that sync started
  await notifyClients({ type: 'SYNC_STARTED' });
  
  try {
    const cache = await caches.open(API_CACHE);
    let successCount = 0;
    let totalEndpoints = SYNC_ENDPOINTS.length;
    
    for (const endpoint of SYNC_ENDPOINTS) {
      const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
      
      try {
        const response = await fetch(url, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          await cache.put(url, response.clone());
          successCount++;
          
          // Notify progress
          await notifyClients({ 
            type: 'SYNC_PROGRESS', 
            progress: Math.round((successCount / totalEndpoints) * 100),
            endpoint: endpoint.split('?')[0],
          });
        }
      } catch (err) {
        console.log(`[SW] Failed to sync ${endpoint}:`, err);
      }
    }
    
    console.log(`[SW] Background sync complete: ${successCount}/${totalEndpoints} endpoints synced`);
    
    // Notify clients that sync is complete
    await notifyClients({ 
      type: 'BACKGROUND_SYNC_COMPLETE',
      timestamp: Date.now(),
      successCount,
      totalEndpoints,
    });
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    await notifyClients({ type: 'SYNC_ERROR', error: error.message });
  }
}

// Sync images from cached data
async function syncImages() {
  console.log('[SW] Background sync: Starting image sync');
  
  try {
    const apiCache = await caches.open(API_CACHE);
    const imageCache = await caches.open(IMAGE_CACHE);
    
    // Get cached wrestler data
    const wrestlersRequest = new Request(`${SUPABASE_URL}/rest/v1/wrestlers?select=*&is_visible=eq.true`);
    const wrestlersResponse = await apiCache.match(wrestlersRequest);
    
    if (wrestlersResponse) {
      const wrestlers = await wrestlersResponse.json();
      const imageUrls = wrestlers
        .filter(w => w.image_url)
        .map(w => w.image_url);
      
      // Cache images in parallel (batch of 5)
      for (let i = 0; i < imageUrls.length; i += 5) {
        const batch = imageUrls.slice(i, i + 5);
        await Promise.all(
          batch.map(async (url) => {
            try {
              const exists = await imageCache.match(url);
              if (!exists) {
                const response = await fetch(url);
                if (response.ok) {
                  await imageCache.put(url, response);
                }
              }
            } catch (e) {
              // Ignore individual image failures
            }
          })
        );
      }
    }
    
    console.log('[SW] Image sync complete');
  } catch (error) {
    console.error('[SW] Image sync failed:', error);
  }
}
