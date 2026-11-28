'use client';

import { useTranslations } from 'next-intl';

interface SpinnerProps {
  /** Đường kính tính bằng px */
  size?: number;
  className?: string;
}

export function Spinner({ size = 40, className = '' }: SpinnerProps) {
  const t = useTranslations('common.spinner');
  return (
    <div
      role="status"
      aria-label={t('loading')}
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 13)) }}
      className={`animate-ai-spin rounded-full border-line border-t-accent ${className}`}
    />
  );
}
