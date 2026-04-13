const CACHE_NAME = 'org-ai-v2';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.svg', '/icon-512.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.searchParams.has('share')) { event.respondWith(fetch(event.request).catch(() => caches.match('/'))); return; }
  if (url.hostname === 'api.anthropic.com') { event.respondWith(fetch(event.request)); return; }
  // Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((resp) => {
        if (resp && resp.status === 200) { caches.open(CACHE_NAME).then((c) => c.put(event.request, resp.clone())); }
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'ORG.AI', body: 'Itens pendentes', tag: 'general' };
  try { if (event.data) data = event.data.json(); } catch(e) {}
  event.waitUntil(self.registration.showNotification(data.title || 'ORG.AI', {
    body: data.body, icon: '/icon-192.svg', badge: '/icon-192.svg', tag: data.tag || 'general',
    vibrate: [100, 50, 100], data: { url: data.url || '/' }, requireInteraction: data.urgent || false,
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
    for (const w of wins) { if (w.url.includes(self.location.origin)) { w.focus(); return; } }
    return clients.openWindow(event.notification.data?.url || '/');
  }));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, urgent } = event.data;
    self.registration.showNotification(title || 'ORG.AI', {
      body, icon: '/icon-192.svg', badge: '/icon-192.svg', tag: tag || 'reminder',
      vibrate: urgent ? [200, 100, 200, 100, 200] : [100, 50, 100],
      data: { url: '/' }, requireInteraction: urgent || false,
    });
  }
});
