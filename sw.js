// Service worker: simpan aset agar aplikasi tetap bisa dibuka saat offline.
const CACHE = 'dpa-v1';
const ASSETS = [
  './', 'index.html', 'css/style.css', 'js/data.js', 'js/store.js', 'js/app.js', 'js/admin.js',
  'manifest.webmanifest', 'assets/icon.svg',
  'assets/cars/toyota-raize.webp', 'assets/cars/chery-c5.webp', 'assets/cars/hyundai-creta.webp',
  'assets/cars/mitsubishi-xpander-cross.webp', 'assets/cars/suzuki-xl7.png', 'assets/cars/toyota-alphard.jpg',
  'assets/cars/daihatsu-luxio.jpg', 'assets/cars/daihatsu-granmax.webp', 'assets/cars/toyota-innova.jpg',
  'assets/cars/toyota-veloz.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Network-first agar perubahan selalu terbaru, cache sebagai cadangan offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
