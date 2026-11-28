import { describe, expect, it } from 'vitest';
import { buildOrderBreakdown, resolveLinePrice } from './orderPricing';

const line = (over = {}) => ({ original: 249000, promoPrice: 174300, codePrice: null, ...over });

describe('resolveLinePrice', () => {
  it('chỉ có khuyến mãi', () => {
    expect(resolveLinePrice(line())).toEqual({ source: 'promotion', finalPrice: 174300 });
  });
  it('mã bằng khuyến mãi: không cộng dồn, giữ khuyến mãi', () => {
    expect(resolveLinePrice(line({ codePrice: 174300 }))).toEqual({ source: 'promotion', finalPrice: 174300 });
  });
  it('mã tốt hơn khuyến mãi: mã thay thế khuyến mãi', () => {
    expect(resolveLinePrice(line({ codePrice: 150000 }))).toEqual({ source: 'coupon', finalPrice: 150000 });
  });
  it('mã kém hơn khuyến mãi: bị bỏ qua', () => {
    expect(resolveLinePrice(line({ codePrice: 220000 })).source).toBe('promotion');
  });
  it('không khuyến mãi, có mã', () => {
    expect(resolveLinePrice(line({ promoPrice: 249000, codePrice: 200000 }))).toEqual({ source: 'coupon', finalPrice: 200000 });
  });
  it('gói khóa học thắng mọi coupon', () => {
    expect(resolveLinePrice(line({ codePrice: 100000, bundlePrice: 180000 }))).toEqual({ source: 'bundle', finalPrice: 180000 });
  });
  it('không giảm gì', () => {
    expect(resolveLinePrice(line({ promoPrice: 249000 }))).toEqual({ source: 'none', finalPrice: 249000 });
  });
});

describe('buildOrderBreakdown', () => {
  it('khuyến mãi 30% + mã 30%: tổng = giá khuyến mãi, mã không được tính', () => {
    const b = buildOrderBreakdown([line({ codePrice: 174300 })], true);
    expect(b).toMatchObject({ original: 249000, promotionDiscount: 74700, couponDiscount: 0, total: 174300, couponNotApplied: true });
  });
  it('mã tốt hơn: giảm tính hết vào mã, tổng khớp giá BE', () => {
    const b = buildOrderBreakdown([line({ codePrice: 149400 })], true);
    expect(b).toMatchObject({ promotionDiscount: 0, couponDiscount: 99600, total: 149400, couponNotApplied: false });
  });
  it('nhiều khóa, trộn nguồn giảm', () => {
    const b = buildOrderBreakdown(
      [line({ codePrice: 100000 }), { original: 100000, promoPrice: 100000, codePrice: null, bundlePrice: 80000 }],
      true,
    );
    expect(b).toMatchObject({ original: 349000, couponDiscount: 149000, bundleDiscount: 20000, total: 180000 });
  });
  it('chưa nhập mã thì không báo mã không áp dụng', () => {
    expect(buildOrderBreakdown([line()], false).couponNotApplied).toBe(false);
  });
});
