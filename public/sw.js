// Giai đoạn 1 (PWA hoá web): service worker chỉ là no-op, tồn tại để thoả điều kiện
// "installability" của Chrome (yêu cầu có SW đang kiểm soát trang) cho Add to Home Screen.
// Chưa cache gì — offline cache Flashcard thật sẽ thêm vào đúng file này ở Giai đoạn 2.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Không gọi event.respondWith() — để browser tự xử lý fetch như bình thường.
});
