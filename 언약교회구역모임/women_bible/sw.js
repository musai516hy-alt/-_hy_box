// 원미언약교회 여성 성도 매일 성경 읽기 서비스 워커 (네트워크 우선 전략: 최신 코드 즉시 반영 + 오프라인 캐싱)
const CACHE_NAME = 'covenant-women-bible-v6';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './bible_engine.js',
  './bible_summaries.js',
  './manifest.json',
  './icon-192.png',
  './icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 네트워크 우선(Network-First) 전략: 최신 코드 항상 즉시 반영
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
