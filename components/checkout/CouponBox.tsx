'use client';

import { useTranslations } from 'next-intl';

interface CouponBoxProps {
  value: string;
  appliedCode: string | null;
  applying: boolean;
  onChange: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
}

/** Ô nhập mã giảm giá; sau khi áp mã thì chuyển thành thẻ hiện mã kèm nút bỏ mã. */
export function CouponBox({ value, appliedCode, applying, onChange, onApply, onRemove }: CouponBoxProps) {
  const t = useTranslations('shop.coupon');

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success-tint px-3 py-2 text-sm">
        <span className="font-mono font-bold text-success-ink">{appliedCode.toUpperCase()}</span>
        <button type="button" onClick={onRemove} className="text-xs font-semibold text-ink-muted hover:text-ink">
          {t('remove')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onApply();
          }
        }}
        placeholder={t('placeholder')}
        aria-label={t('title')}
        className="w-full min-w-0 rounded-lg border border-line px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
      <button
        type="button"
        onClick={onApply}
        disabled={applying}
        className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark hover:text-white disabled:opacity-60"
      >
        {applying ? t('checking') : t('apply')}
      </button>
    </div>
  );
}
