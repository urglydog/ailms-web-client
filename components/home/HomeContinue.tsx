'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CourseThumb } from '@/components/my-courses/CourseThumb';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { useStreak } from '@/hooks/useStreak';
import { pickInProgress, learnHref } from '@/lib/myCourses/model';
import { prefersReducedMotion } from '@/lib/motion/reducedMotion';
import type { CategoryShelfData } from '@/lib/home/categoryShelves';
import type { EnrolledCourse } from '@/types/domain';
import { CourseShelf } from './CourseShelf';

/** Số thẻ bài học tối đa trên hàng "Tiếp tục học". */
const CONTINUE_LIMIT = 8;

/**
 * "Tiếp tục học" trên trang chủ (UDEMY_LAYOUT_ANALYSIS mục 8): hàng thẻ BÀI HỌC đang dở (ảnh có ▶,
 * tên khoá nhỏ, tên bài, thời lượng) cuộn ngang bằng mũi tên + chuỗi ngày học; ngay sau là kệ
 * "Vì bạn đã xem <khoá gần nhất>" lấy từ cùng danh mục (dữ liệu kệ danh mục trang chủ đã tải sẵn).
 * Token chỉ có ở trình duyệt nên khối chỉ vẽ sau khi gắn kết.
 */
export function HomeContinue({ categoryCourses = [] }: { categoryCourses?: CategoryShelfData[] }) {
  const t = useTranslations('home.continue');
  const tShelf = useTranslations('home.shelves');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { data: user } = useCurrentUser();
  const { data: enrollments } = useMyEnrollments();
  const { data: streak } = useStreak(!!user);
  const trackRef = useRef<HTMLUListElement>(null);

  if (!mounted || !user) return null;
  const courses = pickInProgress(enrollments ?? []).slice(0, CONTINUE_LIMIT);
  if (courses.length === 0 && !streak) return null;

  const latest = courses[0];
  const related = latest ? categoryCourses.find((c) => c.name === latest.categoryName) : undefined;

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  const arrow =
    'hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-surface-raised text-ink transition-colors hover:border-accent md:flex';

  return (
    <>
      <section className="bg-surface" aria-labelledby="home-continue-title">
        <div className="shell section-block">
          <div className="section-head">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="home-continue-title" className="section-title">{t('title')}</h2>
              {streak && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-streak-bg px-3 py-1 text-xs font-semibold text-streak-ink"
                  title={streak.hasStudiedToday ? t('studiedToday') : t('notStudiedToday')}
                >
                  <Flame size={14} aria-hidden />
                  {t('streak', { count: streak.currentStreak })}
                  <span className="sr-only">
                    {' '}— {streak.hasStudiedToday ? t('studiedToday') : t('notStudiedToday')}
                  </span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {courses.length > 3 && (
                <>
                  <button type="button" onClick={() => scroll(-1)} aria-label={tShelf('prev')} className={arrow}>
                    <ChevronLeft size={18} aria-hidden />
                  </button>
                  <button type="button" onClick={() => scroll(1)} aria-label={tShelf('next')} className={arrow}>
                    <ChevronRight size={18} aria-hidden />
                  </button>
                </>
              )}
              <Link href="/my-courses" className="text-sm font-semibold text-accent-dark no-underline hover:underline">
                {t('all')} →
              </Link>
            </div>
          </div>
          {courses.length > 0 && (
            <ul
              ref={trackRef}
              className="relative m-0 flex list-none snap-x gap-4 overflow-x-auto p-0 pb-1 [scrollbar-width:none]"
            >
              {courses.map((c) => (
                <li key={c.courseId} className="w-[280px] shrink-0 snap-start">
                  <ContinueLessonCard course={c} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      {latest && related && (
        <CourseShelf
          title={t('becauseViewed', { title: latest.courseTitle })}
          href={`/courses?category=${encodeURIComponent(related.slug)}`}
          courses={related.courses}
        />
      )}
    </>
  );
}

function ContinueLessonCard({ course }: { course: EnrolledCourse }) {
  const t = useTranslations('home.continue');
  const minutes = course.resumeLessonDurationSec ? Math.max(1, Math.round(course.resumeLessonDurationSec / 60)) : null;
  return (
    <Link
      href={learnHref(course)}
      className="card-interactive group relative flex h-full items-stretch gap-3 overflow-hidden p-2 no-underline hover:no-underline"
    >
      <div className="relative w-24 shrink-0 self-center">
        <CourseThumb thumbnailUrl={course.thumbnailUrl} title={course.courseTitle} className="aspect-video rounded-md" />
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-surface-raised">
            <Play size={14} fill="currentColor" />
          </span>
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-1 pr-1">
        <span className="truncate text-[11px] text-ink-muted">{course.courseTitle}</span>
        <span className="line-clamp-2 font-display text-sm font-semibold leading-snug text-ink">
          {course.resumeLessonTitle ?? t('resumeFallback')}
        </span>
        <span className="text-[11px] text-ink-faint">
          {minutes != null ? t('lessonMeta', { minutes }) : t('lessonLabel')}
          {' · '}
          {t('progress', { pct: Math.round(course.progressPct) })}
        </span>
      </div>
    </Link>
  );
}
