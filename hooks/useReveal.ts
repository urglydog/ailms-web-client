'use client';

import { useEffect, useState } from 'react';
import type { RefCallback } from 'react';
import { prefersReducedMotion } from '@/lib/motion/reducedMotion';

/**
 * Trả về [ref, shown]. `shown` thành true một lần khi phần tử vào khung nhìn
 * (hoặc ngay lập tức khi bật giảm chuyển động / trình duyệt không có IntersectionObserver).
 * Dùng cùng lớp CSS `.reveal` + `.is-in` (xem `app/globals.css`).
 *
 * `ref` là callback ref (không phải object ref): phần tử có thể xuất hiện SAU lần render đầu (vd trang
 * hiện "Đang tải" rồi mới có danh sách). Object ref + effect chạy một lần sẽ không bao giờ thấy phần tử đó
 * và nội dung kẹt ở trạng thái ẩn.
 */
export function useReveal<T extends HTMLElement>(): [RefCallback<T>, boolean] {
  const [element, setElement] = useState<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!element || shown) return;
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
    io.observe(element);
    return () => io.disconnect();
  }, [element, shown]);

  return [setElement, shown];
}
