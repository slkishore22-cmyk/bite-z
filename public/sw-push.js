// Dedicated push notification service worker (RFC 8291 / aes128gcm).
// Kept separate from the main Workbox SW so push subscription lifecycle
// is independent from app-shell caching.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'Bitez',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/app/home',
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        url: payload.url || data.url,
      };
    }
  } catch (e) {
    try { if (event.data) data.body = event.data.text(); } catch (_) {}
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: 'bitez-notification',
    renotify: true,
    requireInteraction: false,
    data: { url: data.url },
    vibrate: [40, 30, 40],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/app/home';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of all) {
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        try { await client.navigate(urlToOpen); } catch (_) {}
        return client.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(urlToOpen);
  })());
});