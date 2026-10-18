'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';

interface BillingFormProps {
  name: string;
  phone: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

const INPUT =
  'w-full rounded-xl border border-line px-4 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent';

/** Khối "Thông tin bổ sung" (họ tên, số điện thoại) của trang thanh toán; nhãn gắn đúng với ô nhập. */
export function BillingForm({ name, phone, onNameChange, onPhoneChange }: BillingFormProps) {
  const t = useTranslations('shop.billing');
  const nameId = useId();
  const phoneId = useId();

  return (
    <div className="card p-6">
      <h2 className="mb-4 font-display text-lg font-bold text-ink">{t('title')}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={nameId} className="mb-1.5 block text-sm font-semibold text-ink-muted">
            {t('name')}
          </label>
          <input id={nameId} type="text" placeholder={t('namePh')} className={INPUT} value={name} onChange={(e) => onNameChange(e.target.value)} />
        </div>
        <div>
          <label htmlFor={phoneId} className="mb-1.5 block text-sm font-semibold text-ink-muted">
            {t('phone')}
          </label>
          <input id={phoneId} type="text" placeholder={t('phonePh')} className={INPUT} value={phone} onChange={(e) => onPhoneChange(e.target.value)} />
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-muted">{t('note')}</p>
    </div>
  );
}
