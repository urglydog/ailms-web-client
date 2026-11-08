'use client';

import { useEffect, useRef } from 'react';

/**
 * Gọi `onLoadMore` khi phần tử mốc (đặt ở cuối danh sách) sắp lọt vào màn hình — dùng cho infinite
 * scroll. `rootMargin` 600px để tải trước khi người dùng thật sự chạm đáy, cuộn không bị khựng.
 * Dùng IntersectionObserver thay vì nghe sự kiện scroll: không chạy mỗi khung hình, không tốn CPU.
 */
export function useLoadMoreOnScroll<T extends Element>(enabled: boolean, onLoadMore: () => void, rootMargin = '600px') {
  const ref = useRef<T>(null);
  const callback = useRef(onLoadMore);
  callback.current = onLoadMore;

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) callback.current();
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return ref;
}
