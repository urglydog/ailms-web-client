import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('đen trên trắng bằng 21', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });

  it('không phụ thuộc thứ tự hai màu', () => {
    expect(contrastRatio('#1A6FE0', '#FFFFFF')).toBeCloseTo(contrastRatio('#FFFFFF', '#1A6FE0'), 5);
  });

  it('chữ trắng trên accent #1A6FE0 đạt AA', () => {
    expect(contrastRatio('#FFFFFF', '#1A6FE0')).toBeGreaterThanOrEqual(4.5);
  });

  it('ném lỗi với màu không phải #RRGGBB', () => {
    expect(() => contrastRatio('red', '#FFFFFF')).toThrow();
  });
});
