'use client';

import { useEffect } from 'react';

/**
 * Đăng ký service worker no-op (Giai đoạn 1 PWA) — chỉ để thoả điều kiện
 * installability cho "Add to Home Screen" trên Android/iOS. Thuần progressive
 * enhancement: lỗi đăng ký không được làm vỡ trang.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch((err: unknown) => {
      console.warn('[PWA] service worker registration failed', err);
    });
  }, []);

  return null;
}
