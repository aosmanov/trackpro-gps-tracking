const CACHE_NAME = 'trackpro-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
  'https://cdn.tailwindcss.com'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip requests to different origins
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.startsWith('https://cdn.tailwindcss.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          // For API requests, try network first but return cache on failure
          if (event.request.url.includes('/api/')) {
            return fetch(event.request)
              .then((networkResponse) => {
                // Cache successful API responses
                if (networkResponse.ok) {
                  const responseClone = networkResponse.clone();
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                  });
                }
                return networkResponse;
              })
              .catch(() => {
                console.log('Network failed, serving from cache:', event.request.url);
                return cachedResponse;
              });
          }
          return cachedResponse;
        }

        // Not in cache, try network
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.log('Network request failed:', event.request.url, error);
            
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            throw error;
          });
      })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'location-sync') {
    event.waitUntil(syncLocationUpdates());
  }
  
  if (event.tag === 'status-sync') {
    event.waitUntil(syncStatusUpdates());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      tag: data.tag || 'trackpro-notification',
      data: data,
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'TrackPro Update', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for background sync
async function syncLocationUpdates() {
  // Get pending location updates from IndexedDB and send them
  // This would be implemented with actual data persistence
  console.log('Syncing location updates...');
}

async function syncStatusUpdates() {
  // Get pending status updates from IndexedDB and send them
  // This would be implemented with actual data persistence
  console.log('Syncing status updates...');
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});