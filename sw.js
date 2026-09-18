// Premier Group Task Board — Service Worker
// Handles push notifications even when the browser is closed.

const CACHE_NAME = 'pg-taskboard-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

// Handle push notifications sent from the app
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

  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// When user taps the notification, open the app
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/taskboard/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If app already open, focus it
      for (const client of windowClients) {
        if (client.url.includes('taskboard') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Background sync — check for new tasks periodically (Android Chrome only)
self.addEventListener('sync', (e) => {
  if (e.tag === 'check-tasks') {
    e.waitUntil(checkForNewTasks());
  }
});

async function checkForNewTasks() {
  // This runs in background when sync is triggered
  // The app itself handles notification logic via the main thread
  // This is just a keepalive
  return Promise.resolve();
}
