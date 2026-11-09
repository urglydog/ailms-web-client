import { describe, expect, it } from 'vitest';
import { duration, ease, scale, stagger } from './tokens';

describe('motion tokens', () => {
  it('chuyển động UI dưới 300ms, chỉ chuyển trang được dài hơn', () => {
    const { page, ...ui } = duration;
    for (const v of Object.values(ui)) expect(v).toBeLessThanOrEqual(0.3);
    expect(page).toBeLessThanOrEqual(0.5);
  });

  it('đường cong vào/ra là ease-out (bắt đầu nhanh), không phải ease-in', () => {
    // Điểm điều khiển thứ nhất có y > x nghĩa là đi nhanh lúc đầu.
    const [x1, y1] = ease.out;
    expect(y1).toBeGreaterThan(x1);
  });

  it('không hiện từ scale(0) và so le trong khoảng 30–80ms', () => {
    expect(scale.enter).toBeGreaterThanOrEqual(0.9);
    expect(stagger).toBeGreaterThanOrEqual(0.03);
    expect(stagger).toBeLessThanOrEqual(0.08);
  });
});
