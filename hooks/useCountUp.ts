'use client';

import { useEffect, useState } from 'react';
import { countUpValue } from '@/lib/motion/countUp';
import { prefersReducedMotion } from '@/lib/motion/reducedMotion';

/** Đếm từ 0 tới `target` trong `durationMs` (mặc định 900ms, ease-out). Giảm chuyển động: nhảy thẳng tới đích. */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      setValue(countUpValue(target, elapsed, durationMs));
      if (elapsed < durationMs) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
