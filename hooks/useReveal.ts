'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { prefersReducedMotion } from '@/lib/motion/reducedMotion';

/**
 * Trả về [ref, shown]. `shown` thành true một lần khi phần tử vào khung nhìn
 * (hoặc ngay lập tức khi bật giảm chuyển động / trình duyệt không có IntersectionObserver).
 * Dùng cùng lớp CSS `.reveal` + `.is-in` (xem `app/globals.css`).
 */
export function useReveal<T extends HTMLElement>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, shown];
}
