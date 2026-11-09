import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('phân tách hàng nghìn theo ngôn ngữ và thêm đơn vị đồng', () => {
    expect(formatMoney(199000, 'vi')).toBe('199.000đ');
    expect(formatMoney(199000, 'en')).toBe('199,000đ');
    expect(formatMoney(0, 'vi')).toBe('0đ');
  });
});
