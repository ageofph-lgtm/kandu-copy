// Versão do ficheiro — mudar sempre que o conteúdo muda, para o browser ver
const SW_VERSAO = '2026-11-14b';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : '' }; }

  // Bolinha no ícone do app (Android/desktop): o servidor manda o total por ler
  if (typeof d.badge_count === 'number' && self.navigator.setAppBadge) {
    d.badge_count > 0
      ? self.navigator.setAppBadge(d.badge_count).catch(() => {})
      : self.navigator.clearAppBadge?.().catch(() => {});
  }

  e.waitUntil(self.registration.showNotification(d.title || 'KANDU', {
    body: d.body || '',
    icon: new URL('/kandu-icon-192.png', self.location.origin).href,
    badge: new URL('/kandu-badge-k-96.png', self.location.origin).href,
    tag: d.tag || undefined,
    renotify: !!d.tag,
    vibrate: [80, 40, 80],
    data: { link: d.link || '/' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || '/';
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (new URL(w.url).origin !== self.location.origin) continue;
      try { await w.focus(); } catch {}
      w.postMessage({ type: 'kandu_open_link', link });
      return;
    }
    await self.clients.openWindow(new URL(link, self.location.origin).href);
  })());
});
