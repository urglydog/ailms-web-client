'use client';

import { useTranslations } from 'next-intl';
import { formatMoney } from '@/lib/format';
import type { AvailableCoupon } from '@/types/domain';

interface CouponPickerProps {
  coupons: AvailableCoupon[];
  loading: boolean;
  /** null = không dùng khuyến mãi nào. */
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

/**
 * Danh sách khuyến mãi học viên TỰ CHỌN ở trang thanh toán (giảm nhiều nhất xếp trên cùng) — thay
 * cho việc BE âm thầm áp coupon tự động mà người dùng không can thiệp được.
 */
export function CouponPicker({ coupons, loading, selectedId, onSelect }: CouponPickerProps) {
  const t = useTranslations('shop.coupon');

  if (loading) {
    return <p className="text-xs text-ink-muted">{t('pickerLoading')}</p>;
  }
  if (coupons.length === 0) return null;

  const rowClass = (active: boolean) =>
    `flex cursor-pointer items-start gap-3 border px-3 py-2 text-sm transition-colors ${
      active ? 'border-accent bg-accent/5' : 'border-line bg-surface-raised hover:bg-tint'
    }`;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold text-ink">{t('pickerTitle')}</legend>
      {coupons.map((c) => {
        const label =
          c.discountType === 'PERCENTAGE'
            ? t('pickerPercent', { value: c.discountValue })
            : t('pickerFixed', { value: formatMoney(c.discountValue) });
        return (
          <label key={c.id} className={rowClass(selectedId === c.id)}>
            <input
              type="radio"
              name="checkout-coupon"
              checked={selectedId === c.id}
              onChange={() => onSelect(c.id)}
              className="mt-1 accent-[var(--accent,#1A6FE0)]"
            />
            <span className="flex flex-col">
              <span className="font-semibold text-ink">{label}</span>
              <span className="text-xs text-ink-muted">
                {t('pickerSave', { amount: formatMoney(c.savings) })} ·{' '}
                {t('pickerExpires', { date: new Date(c.endAt).toLocaleDateString('vi-VN') })}
              </span>
            </span>
          </label>
        );
      })}
      <label className={rowClass(selectedId === null)}>
        <input
          type="radio"
          name="checkout-coupon"
          checked={selectedId === null}
          onChange={() => onSelect(null)}
          className="mt-1 accent-[var(--accent,#1A6FE0)]"
        />
        <span className="text-ink-muted">{t('pickerNone')}</span>
      </label>
    </fieldset>
  );
}
