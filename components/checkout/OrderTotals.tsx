'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatMoney } from '@/lib/shop/money';
import type { OrderBreakdown } from '@/lib/shop/orderPricing';

interface OrderTotalsProps {
  /** Số khóa học tính tiền. */
  count: number;
  /** Chỉ giỏ hàng truyền: số khóa đang chọn trên tổng số khóa trong giỏ. */
  selectedOf?: { selected: number; total: number };
  original: number;
  total: number;
  /** Có thì tách dòng giảm giá theo nguồn (khuyến mãi / mã / gói) thay vì 1 dòng "Đã giảm" chung. */
  breakdown?: OrderBreakdown;
  /** Mã nhập tay đang áp (để ghi tên mã ở dòng giảm giá và ở ghi chú không cộng dồn). */
  couponCode?: string | null;
}

/** Các dòng tiền của tóm tắt đơn hàng: (đã chọn), tạm tính, đã giảm (chỉ khi có giảm) và tổng cộng. */
export function OrderTotals({ count, selectedOf, original, total, breakdown, couponCode }: OrderTotalsProps) {
  const t = useTranslations('shop.summary');
  const locale = useLocale();
  const saved = original - total;

  return (
    <div className="flex flex-col gap-2 text-sm">
      {selectedOf && (
        <div className="flex items-center justify-between text-ink-muted">
          <span>{t('selected')}</span>
          <span>{t('selectedOf', selectedOf)}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-ink-muted">
        <span>{count > 1 ? t('subtotal', { count }) : t('subtotalOne')}</span>
        <span className="font-semibold text-ink">{formatMoney(original, locale)}</span>
      </div>
      {breakdown ? (
        <>
          <DiscountRow label={t('promotionDiscount')} amount={breakdown.promotionDiscount} locale={locale} />
          <DiscountRow
            label={t('couponDiscount', { code: (couponCode ?? '').toUpperCase() })}
            amount={breakdown.couponDiscount}
            locale={locale}
          />
          <DiscountRow label={t('bundleDiscount')} amount={breakdown.bundleDiscount} locale={locale} />
          {breakdown.couponNotApplied && couponCode && (
            <p className="m-0 rounded-lg bg-tint px-3 py-2 text-xs text-ink-muted">
              {t('couponNotApplied', { code: couponCode.toUpperCase() })}
            </p>
          )}
        </>
      ) : (
        <DiscountRow label={t('discount')} amount={saved} locale={locale} />
      )}
      <div className="mt-1 flex items-center justify-between border-t border-line-soft pt-3">
        <span className="font-display text-base font-bold text-ink">{t('total')}</span>
        <span className="font-display text-xl font-bold text-accent-dark">{formatMoney(total, locale)}</span>
      </div>
    </div>
  );
}

function DiscountRow({ label, amount, locale }: { label: string; amount: number; locale: string }) {
  if (amount <= 0) return null;
  return (
    <div className="flex items-center justify-between text-ink-muted">
      <span>{label}</span>
      <span className="font-semibold text-danger">-{formatMoney(amount, locale)}</span>
    </div>
  );
}
