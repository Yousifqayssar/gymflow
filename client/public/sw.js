// GymFlow service worker. Its only job is to make the website installable as an app
// ("Add to Home screen"). It deliberately caches NOTHING: GymFlow needs the server for
// everything (check-in, bookings, payments), and old cached pages could show wrong data.
// Every request simply goes to the network, exactly as without a service worker.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  // Only plain page/file loads of GymFlow itself; everything else (API posts, uploads, map tiles from
  // OpenStreetMap) is not touched at all. Fetching other websites from here would also be blocked by
  // the Content Security Policy (connect-src 'self').
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request));
});
