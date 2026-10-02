self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Horustech CRM', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Horustech CRM';
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo-icon.png',
    badge: '/logo-icon.png',
    tag: data.tag || data.conversationId || 'crm',
    data: { conversationId: data.conversationId || null }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const conversationId = (event.notification.data && event.notification.data.conversationId) || null;
  const url = conversationId ? '/?chat=' + encodeURIComponent(conversationId) : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (typeof client.navigate === 'function') {
            return client.navigate(url).then(() => client.focus());
          }
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
