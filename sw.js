// Premier Group Task Board — Service Worker v3
// Notifications-only. Never caches anything — all requests go to network.

const SW_VERSION = 'pg-v3';

self.addEventListener('install', () => {
  self.skipWaiting(); // take control immediately
});

self.addEventListener('activate', (e) => {
  // Clear ALL caches from any previous version
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

// NETWORK ONLY — never serve from cache
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() =>
      new Response('Offline — check your connection', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      })
    )
  );
});

// Handle push notifications (future server-sent pushes)
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch(_) {}
  e.waitUntil(
    self.registration.showNotification(
      data.title || 'Premier Group Task Board',
      {
        body:             data.body || 'You have a new task assigned.',
        tag:              data.tag  || 'pg-task',
        data:             { url: data.url || '/taskboard/' },
        requireInteraction: true,
        vibrate:          [200, 100, 200],
      }
    )
  );
});

// Tap notification → open or focus the app
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/taskboard/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('taskboard') && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
