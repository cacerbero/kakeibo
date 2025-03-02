const CACHE_NAME = 'budget-planner-v3'; 
const FILES_TO_CACHE = [
  '/icons/favicon.ico',
  '/index.html',
  '/app.js',
  '/style.css'
];

// Install event: cache necessary files
self.addEventListener('install', (evt) => {
  self.skipWaiting();  
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(FILES_TO_CACHE); 
      })
      .catch((err) => console.error('Cache failed:', err))
  );
});

// Activate event: delete old caches and take control
self.addEventListener('activate', (evt) => {
  const cacheWhitelist = [CACHE_NAME]; 
  evt.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim(); 
    })
  );
});

// Fetch event: try the cache first, then network
self.addEventListener('fetch', (evt) => {
  evt.respondWith(
    caches.match(evt.request).then((cachedResponse) => {
      if (cachedResponse) {       
        fetch(evt.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(evt.request, networkResponse); 
          });
        });
        return cachedResponse; 
      } else {
        return fetch(evt.request);
      }
    })
  );
});
