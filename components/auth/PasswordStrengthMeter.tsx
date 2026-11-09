'use client';

import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { passwordStrength, type StrengthLevel } from '@/lib/auth/passwordStrength';

const BAR: Record<StrengthLevel, string> = {
  empty: 'bg-line',
  short: 'bg-danger',
  weak: 'bg-star',
  good: 'bg-accent',
  strong: 'bg-success',
};

const TEXT: Record<StrengthLevel, string> = {
  empty: 'text-ink-muted',
  short: 'text-danger',
  weak: 'text-ink-muted',
  good: 'text-accent-dark',
  strong: 'text-success-ink',
};

/** Thanh mức độ bảo mật của mật khẩu đang gõ. Chưa gõ gì thì không vẽ; đọc được qua role status. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const t = useTranslations('auth.strength');
  const { score, level } = passwordStrength(password);
  if (level === 'empty') return null;

  return (
    <div role="status" className="mt-1">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] text-ink-muted">
          {t('label')} <span className={`font-semibold ${TEXT[level]}`}>{t(level)}</span>
        </span>
      </div>
      <div className="flex h-1 w-full gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`flex-1 rounded-full transition-colors duration-300 ${n <= score ? BAR[level] : 'bg-line'}`} />
        ))}
      </div>
    </div>
  );
}

/** Dòng báo mật khẩu xác nhận có khớp hay chưa; chưa nhập xác nhận thì không vẽ. */
export function PasswordMatchHint({ password, confirm }: { password: string; confirm: string }) {
  const t = useTranslations('auth.match');
  if (confirm.length === 0) return null;
  const match = confirm === password;
  return (
    <span className={`mt-1 flex items-center gap-1 text-[11px] font-semibold ${match ? 'text-success-ink' : 'text-danger'}`}>
      {match ? <Check size={12} aria-hidden /> : <X size={12} aria-hidden />}
      {match ? t('yes') : t('no')}
    </span>
  );
}
