'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatMoney } from '@/lib/shop/money';

interface OrderTotalsProps {
  /** Số khóa học tính tiền. */
  count: number;
  /** Chỉ giỏ hàng truyền: số khóa đang chọn trên tổng số khóa trong giỏ. */
  selectedOf?: { selected: number; total: number };
  original: number;
  total: number;
}

/** Các dòng tiền của tóm tắt đơn hàng: (đã chọn), tạm tính, đã giảm (chỉ khi có giảm) và tổng cộng. */
export function OrderTotals({ count, selectedOf, original, total }: OrderTotalsProps) {
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
      {saved > 0 && (
        <div className="flex items-center justify-between text-ink-muted">
          <span>{t('discount')}</span>
          <span className="font-semibold text-danger">-{formatMoney(saved, locale)}</span>
        </div>
      )}
      <div className="mt-1 flex items-center justify-between border-t border-line-soft pt-3">
        <span className="font-display text-base font-bold text-ink">{t('total')}</span>
        <span className="font-display text-xl font-bold text-accent-dark">{formatMoney(total, locale)}</span>
      </div>
    </div>
  );
}
