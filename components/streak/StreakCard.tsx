'use client';

import { useTranslations } from 'next-intl';
import type { StreakResponse } from '@/hooks/useStreak';

/** Streak cá nhân — tách từ `app/(public)/u/[userId]/page.tsx` (05/10/2026) để dùng lại ở
 * `/community` (12/10/2026) mà không copy-paste JSX. Chỉ hiện của chính người đang đăng nhập,
 * không có khái niệm xem streak của người khác (BE chỉ có endpoint `/streak/me`). */
export function StreakCard({ streak }: { streak: StreakResponse }) {
  const t = useTranslations('header.streak');
  const tc = useTranslations('common.streak');
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🔥</span>
        <div>
          <h3 className="font-display text-sm font-bold text-ink">{t('title', { days: streak.currentStreak })}</h3>
          <p className="text-xs text-ink-muted">{t('record', { days: streak.longestStreak })}</p>
        </div>
      </div>
      <p className="text-xs text-ink-muted">
        {tc('freezes', { remaining: streak.freezesRemaining })}
      </p>
    </div>
  );
}
