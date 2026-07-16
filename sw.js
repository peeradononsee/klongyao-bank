/* ============================================================
   Service Worker — กลองยาวแบงค์ PWA
   กลยุทธ์: precache แอปหลัก (app shell) เพื่อให้เปิดออฟไลน์ได้
   ปรับ CACHE เวอร์ชันทุกครั้งที่แก้ไฟล์ เพื่อบังคับอัปเดต
   ============================================================ */
const CACHE = 'klongyao-bank-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // เฉพาะ same-origin เท่านั้น (ปล่อยให้ฟอนต์ Google โหลดผ่านเน็ตตามปกติ)
  if (url.origin !== self.location.origin) return;

  // navigation → network first, fallback cache (กันหน้าเปล่าเวลาออฟไลน์)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // static assets → cache first
  e.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => cached)
    )
  );
});
