'use client';

import { useSyncExternalStore } from 'react';

/**
 * Theo dõi một media query. Lần render ở máy chủ (và lần hydrate đầu) trả `serverValue` để HTML
 * khớp nhau; sau đó đổi theo trình duyệt.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : serverValue),
    () => serverValue,
  );
}
