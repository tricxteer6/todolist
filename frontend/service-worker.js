self.addEventListener('push', (event) => {
  let data = { title: 'TaskFlow', body: 'You have a task reminder.', url: '/#tasks' };
  try { data = { ...data, ...event.data.json() }; } catch (_error) { /* use fallback payload */ }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: data.taskId ? `task-${data.taskId}` : 'taskflow-reminder',
    data: { url: data.url || '/#tasks' }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const target = event.notification.data?.url || '/#tasks';
    for (const client of windows) if ('focus' in client) { client.navigate(target); return client.focus(); }
    return clients.openWindow(target);
  }));
});
