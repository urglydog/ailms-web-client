import { describe, expect, it } from 'vitest';
import { countUpValue, easeOutCubic } from './countUp';

describe('easeOutCubic', () => {
  it('bắt đầu 0, kết thúc 1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('kẹp giá trị ngoài đoạn 0 đến 1', () => {
    expect(easeOutCubic(-3)).toBe(0);
    expect(easeOutCubic(9)).toBe(1);
  });

  it('nhanh lúc đầu: ở nửa thời gian đã vượt 50%', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe('countUpValue', () => {
  it('bằng 0 lúc bắt đầu và bằng đích khi đủ thời gian', () => {
    expect(countUpValue(60, 0, 900)).toBe(0);
    expect(countUpValue(60, 900, 900)).toBe(60);
  });

  it('không vượt đích khi quá thời gian', () => {
    expect(countUpValue(60, 5000, 900)).toBe(60);
  });

  it('đơn điệu tăng', () => {
    const a = countUpValue(100, 100, 900);
    const b = countUpValue(100, 400, 900);
    expect(b).toBeGreaterThanOrEqual(a);
  });

  it('thời lượng bằng 0 trả ngay về đích', () => {
    expect(countUpValue(42, 0, 0)).toBe(42);
  });
});
