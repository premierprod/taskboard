// Premier Group Task Board — Service Worker
// IMPORTANT: This SW is notifications-only. It does NOT cache anything.
// All requests always go to the network to ensure fresh data from the Sheet.

const CACHE_NAME = 'pg-taskboard-v2';

self.addEventListener('install', (e) => {
  // Take control immediately, don't wait for old SW to finish
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Clear any old caches from previous versions
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => clients.claim())
  );
});

// NETWORK ONLY — never cache anything
// This ensures the HTML and Sheet data always come fresh from the server
self.addEventListener('fetch', (e) => {
  // Always fetch from network, never from cache
  e.respondWith(
    fetch(e.request).catch(() => {
      // If network fails (offline), just fail gracefully
      return new Response('Offline - please check your connection', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    })
  );
});

// Handle push notifications
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch(_) {}
  const title = data.title || 'Premier Group Task Board';
  const options = {
    body: data.body || 'You have a new task assigned.',
    icon: data.icon || '/taskboard/icon-192.png',
    badge: data.badge || '/taskboard/icon-192.png',
    tag: data.tag || 'pg-task',
    data: { url: data.url || '/taskboard/' },
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// When user taps the notification, open the app
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/taskboard/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('taskboard') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
