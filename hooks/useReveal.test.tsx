import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useReveal } from './useReveal';

let trigger: ((isIntersecting: boolean) => void) | null = null;

class FakeObserver {
  constructor(cb: IntersectionObserverCallback) {
    trigger = (isIntersecting: boolean) =>
      cb([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
  observe() {}
  disconnect() {}
}

function Probe() {
  const [ref, shown] = useReveal<HTMLDivElement>();
  return <div ref={ref} data-testid="probe" data-shown={String(shown)} />;
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe('useReveal', () => {
  beforeEach(() => {
    trigger = null;
    vi.stubGlobal('IntersectionObserver', FakeObserver as unknown as typeof IntersectionObserver);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ẩn cho đến khi phần tử vào khung nhìn', () => {
    stubReducedMotion(false);
    render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveAttribute('data-shown', 'false');
    act(() => trigger?.(true));
    expect(screen.getByTestId('probe')).toHaveAttribute('data-shown', 'true');
  });

  it('không hiện khi chưa giao nhau', () => {
    stubReducedMotion(false);
    render(<Probe />);
    act(() => trigger?.(false));
    expect(screen.getByTestId('probe')).toHaveAttribute('data-shown', 'false');
  });

  it('hiện ngay khi bật giảm chuyển động', () => {
    stubReducedMotion(true);
    render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveAttribute('data-shown', 'true');
  });
});
