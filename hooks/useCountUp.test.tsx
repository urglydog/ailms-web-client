import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCountUp } from './useCountUp';

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe('useCountUp', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('nhảy thẳng tới đích khi bật giảm chuyển động', () => {
    stubReducedMotion(true);
    const { result } = renderHook(() => useCountUp(60));
    expect(result.current).toBe(60);
  });

  it('bắt đầu từ 0 khi cho phép chuyển động', () => {
    stubReducedMotion(false);
    const { result } = renderHook(() => useCountUp(60));
    expect(result.current).toBe(0);
  });
});
