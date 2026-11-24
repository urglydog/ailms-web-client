'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ContinueHero } from '@/components/my-courses/ContinueHero';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { useStreak } from '@/hooks/useStreak';
import { pickContinue } from '@/lib/myCourses/model';

/**
 * Khối "Tiếp tục học" + streak trên trang chủ — chỉ khi đã đăng nhập và có khóa đang học dở.
 * Token chỉ có ở trình duyệt nên khối chỉ vẽ sau khi gắn kết (HTML máy chủ không có khối này).
 */
export function HomeContinue() {
  const t = useTranslations('home.continue');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { data: user } = useCurrentUser();
  const { data: enrollments } = useMyEnrollments();
  const { data: streak } = useStreak(!!user);

  if (!mounted || !user) return null;
  const course = pickContinue(enrollments ?? []);
  if (!course && !streak) return null;

  return (
    <section className="bg-surface" aria-labelledby="home-continue-title">
      <div className="shell section-block">
        <div className="section-head">
          <h2 id="home-continue-title" className="section-title">{t('title')}</h2>
          <Link href="/my-courses" className="text-sm font-semibold text-accent-dark no-underline hover:underline">
            {t('all')} →
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          {course ? <ContinueHero course={course} profileHref={null} /> : <div />}
          {streak && (
            <div className="card flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-streak-bg text-streak-ink">
                <Flame size={24} aria-hidden />
              </span>
              <div>
                <p className="m-0 font-display text-lg font-bold text-ink">{t('streak', { count: streak.currentStreak })}</p>
                <p className="m-0 mt-0.5 text-xs text-ink-muted">
                  {streak.hasStudiedToday ? t('studiedToday') : t('notStudiedToday')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
