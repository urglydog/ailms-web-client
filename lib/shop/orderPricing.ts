/**
 * Giá đơn hàng: tách rõ khuyến mãi tự động, mã giảm giá và gói khóa học.
 *
 * Quy tắc của BE (CouponService, BR-COUPON-01): các coupon KHÔNG cộng dồn. Với mỗi khóa BE chỉ chọn
 * 1 coupon cho giá thấp nhất, tính trên GIÁ GỐC. Nghĩa là mã nhập tay hoặc thay thế khuyến mãi (khi
 * giảm nhiều hơn), hoặc bị bỏ qua (khi khuyến mãi đã tốt hơn hoặc bằng). Gói khóa học thì thắng mọi coupon.
 */

export type PriceSource = 'none' | 'promotion' | 'coupon' | 'bundle';

export interface OrderLinePricing {
  /** Giá gốc của khóa. */
  original: number;
  /** Giá khi chỉ áp khuyến mãi tự động/được chọn (bằng `original` nếu không có). */
  promoPrice: number;
  /** Giá mã nhập tay cho khóa này, null nếu chưa nhập mã hoặc mã không áp dụng được cho khóa. */
  codePrice: number | null;
  /** Giá theo gói khóa học, undefined nếu khóa không thuộc gói nào đang khớp. */
  bundlePrice?: number;
}

export interface OrderLineResult {
  source: PriceSource;
  finalPrice: number;
}

export interface OrderBreakdown {
  original: number;
  promotionDiscount: number;
  couponDiscount: number;
  bundleDiscount: number;
  total: number;
  /** Có nhập mã nhưng không khóa nào được hưởng mã (khuyến mãi/gói đã tốt hơn hoặc bằng, hoặc mã không áp dụng). */
  couponNotApplied: boolean;
}

export function resolveLinePrice(line: OrderLinePricing): OrderLineResult {
  if (line.bundlePrice !== undefined) return { source: 'bundle', finalPrice: line.bundlePrice };
  if (line.codePrice !== null && line.codePrice < line.promoPrice) {
    return { source: 'coupon', finalPrice: line.codePrice };
  }
  if (line.promoPrice < line.original) return { source: 'promotion', finalPrice: line.promoPrice };
  return { source: 'none', finalPrice: line.original };
}

export function buildOrderBreakdown(lines: OrderLinePricing[], hasEnteredCode: boolean): OrderBreakdown {
  const out: OrderBreakdown = {
    original: 0, promotionDiscount: 0, couponDiscount: 0, bundleDiscount: 0, total: 0, couponNotApplied: false,
  };
  for (const line of lines) {
    const { source, finalPrice } = resolveLinePrice(line);
    const discount = line.original - finalPrice;
    out.original += line.original;
    out.total += finalPrice;
    if (source === 'promotion') out.promotionDiscount += discount;
    else if (source === 'coupon') out.couponDiscount += discount;
    else if (source === 'bundle') out.bundleDiscount += discount;
  }
  out.couponNotApplied = hasEnteredCode && lines.length > 0 && out.couponDiscount === 0;
  return out;
}
