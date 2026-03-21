const CACHE_NAME = 'clinic-app-v1.0.1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/script.js',
  '/db-api.js',
  '/broadcast.js',
  '/auth.js',
  '/theme-switcher.js',
  '/phone-utils.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// In a real PWA, you'd add more, but for now we focus on installability
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Just for cache, but continue to network for latest
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Simple "Network First" approach to keep it auto-refreshing
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
