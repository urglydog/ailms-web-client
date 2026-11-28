import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { CouponPicker } from './CouponPicker';
import type { AvailableCoupon } from '@/types/domain';

const coupon = {
  id: 7, discountType: 'PERCENTAGE', discountValue: 30, scopeType: 'ALL_COURSES',
  endAt: '2030-01-01T00:00:00', savings: 74700, applicableCourseIds: [160],
} as AvailableCoupon;

describe('CouponPicker', () => {
  it('mỗi radio có nhãn thật, không phải "on"', () => {
    renderWithIntl(<CouponPicker coupons={[coupon]} loading={false} selectedId={7} onSelect={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    for (const r of radios) {
      expect(r.getAttribute('aria-label')).toBeTruthy();
      expect(r.getAttribute('aria-label')).not.toBe('on');
    }
    expect(screen.getByRole('radio', { name: /Giảm 30%/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Không dùng khuyến mãi' })).not.toBeChecked();
  });
});
