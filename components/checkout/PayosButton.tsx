'use client';

import { QrCode } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PayosButtonProps {
  /** Đang tạo phiên thanh toán bằng phương thức này. */
  paying: boolean;
  disabled: boolean;
  onPay: () => void;
}

/** Nút chọn phương thức thanh toán chuyển khoản QR qua PayOS (phương thức duy nhất hiện có). */
export function PayosButton({ paying, disabled, onPay }: PayosButtonProps) {
  const t = useTranslations('shop.pay');
  return (
    <button
      type="button"
      onClick={onPay}
      disabled={disabled}
      aria-busy={paying}
      className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-colors disabled:cursor-not-allowed ${
        paying ? 'border-accent bg-tint' : 'border-line bg-white hover:border-accent'
      }`}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
          <QrCode size={16} aria-hidden />
        </span>
        <span className="font-semibold text-ink">{t('payos')}</span>
      </span>
      {paying && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />}
    </button>
  );
}
