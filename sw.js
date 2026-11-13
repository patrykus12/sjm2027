// Service worker wersji iOS (PWA): gra działa offline. Pliki gry w pamięci podręcznej, nowa wersja przy kolejnym
// uruchomieniu z siecią (build.ps1 wstawia numer wersji i listę plików). Zapisy gry są w IndexedDB – nie tutaj.
const VERSION = 'sjm-261113-0912';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.png', './css/style.css', './js/calendar.js', './js/data.js', './js/events.js', './js/live.js', './js/main.js', './js/manager.js', './js/names.js', './js/realdb.js', './js/realelo.js', './js/realextra.js', './js/realglobes.js', './js/realmedals.js', './js/realpodium.js', './js/realstaff.js', './js/realtitles.js', './js/sim.js', './js/traits.js', './js/ui.js', './js/update.js', './js/util.js', './js/version.js', './js/world.js'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// najpierw sieć (świeża wersja), bez sieci – pamięć podręczna
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok && new URL(e.request.url).origin === location.origin) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || caches.match('./index.html'))));
});
