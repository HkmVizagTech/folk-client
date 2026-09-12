// Service Worker for Folkvizag (PWA)
const CACHE_NAME = 'folkvizag-v1.5'; // Increment version to force update
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json'
];

// Install: Cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: Cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network First for index.html/root, Stale-While-Revalidate for others
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const BACKEND_URL = 'https://hrm-backend-uzim.onrender.com';

  // Bypass the Service Worker for non-GET requests (e.g. POST, PUT API calls)
  if (event.request.method !== 'GET') {
    return;
  }

  // Bypass the Service Worker for backend API calls
  if (event.request.url.startsWith(BACKEND_URL) || event.request.url.includes('googleapis.com')) {
    return; // Let the browser handle the fetch directly
  }

  // For the main app entry point, always try network first
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For other assets, use Stale-While-Revalidate (GET only)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // Only cache successful GET requests
        if (event.request.method === 'GET' && networkResponse && networkResponse.status === 200) {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
        }
        return networkResponse;
      }).catch(() => Response.error());

      return cachedResponse || fetchPromise;
    })
  );
});
