import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLoadMoreOnScroll } from './useLoadMoreOnScroll';

let trigger: ((entries: { isIntersecting: boolean }[]) => void) | null = null;
const disconnect = vi.fn();

beforeEach(() => {
  trigger = null;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        trigger = cb;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

function Probe({ enabled, onMore }: { enabled: boolean; onMore: () => void }) {
  const ref = useLoadMoreOnScroll<HTMLDivElement>(enabled, onMore);
  return <div ref={ref} />;
}

describe('useLoadMoreOnScroll', () => {
  it('gọi tải thêm khi mốc lọt vào khung nhìn', () => {
    const onMore = vi.fn();
    render(<Probe enabled onMore={onMore} />);
    trigger?.([{ isIntersecting: false }]);
    expect(onMore).not.toHaveBeenCalled();
    trigger?.([{ isIntersecting: true }]);
    expect(onMore).toHaveBeenCalledTimes(1);
  });

  it('không theo dõi khi đã hết dữ liệu', () => {
    render(<Probe enabled={false} onMore={vi.fn()} />);
    expect(trigger).toBeNull();
  });
});
