'use client';

import Link from 'next/link';
import { Award, Play } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { certificateHref, learnHref, statusOf } from '@/lib/myCourses/model';
import { formatRelative } from '@/lib/myCourses/relativeTime';
import type { EnrolledCourse } from '@/types/domain';
import { CourseThumb } from './CourseThumb';

interface ContinueHeroProps {
  course: EnrolledCourse;
  /** Liên kết tới hồ sơ công khai (tab Chứng chỉ) của chính người dùng; null khi chưa biết id. */
  profileHref: string | null;
}

/** Khối đầu trang Khóa học của tôi (spec mục 6): khóa đang học gần nhất với nút "Học tiếp"; khi mọi khóa đã
 * xong thì đổi thành khối chúc mừng với "Xem chứng chỉ" và "Chia sẻ lên hồ sơ". */
export function ContinueHero({ course, profileHref }: ContinueHeroProps) {
  const t = useTranslations('myCourses');
  const locale = useLocale();
  const completed = statusOf(course) === 'completed';
  const certHref = certificateHref(course);

  if (completed) {
    return (
      <section className="grid gap-4 rounded-panel border border-line bg-surface-raised p-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
        <CourseThumb thumbnailUrl={course.thumbnailUrl} title={course.courseTitle} className="aspect-[16/10] rounded-lg" />
        <div>
          <p className="m-0 mb-1 text-[11px] font-medium tracking-wide text-success-ink">{t('done.label')}</p>
          <h2 className="m-0 mb-1 font-display text-lg font-semibold text-ink">{course.courseTitle}</h2>
          <p className="m-0 mb-3 text-xs text-ink-muted">{t('done.body')}</p>
          <div className="flex flex-wrap items-center gap-2">
            {certHref && (
              <Link
                href={certHref}
                className="btn-tactile inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
              >
                <Award size={15} aria-hidden />
                {t('done.viewCertificate')}
              </Link>
            )}
            {certHref && profileHref && (
              <Link
                href={profileHref}
                className="rounded-md px-3 py-2 text-[13px] font-semibold text-accent-dark no-underline hover:bg-tint hover:no-underline"
              >
                {t('done.share')}
              </Link>
            )}
            <Link
              href={`/courses/${course.courseSlug}`}
              className="rounded-md px-3 py-2 text-[13px] font-semibold text-accent-dark no-underline hover:bg-tint hover:no-underline"
            >
              {t('continue.details')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const meta = course.lastAccessedAt
    ? `${t('continue.progress', { pct: Math.round(course.progressPct) })} · ${t('continue.lastAccessed', {
        time: formatRelative(course.lastAccessedAt, locale),
      })}`
    : t('continue.progress', { pct: Math.round(course.progressPct) });

  return (
    <section className="grid gap-4 rounded-panel bg-accent p-4 text-white sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
      <div className="relative">
        <CourseThumb thumbnailUrl={course.thumbnailUrl} title={course.courseTitle} className="aspect-[16/10] rounded-lg" />
        <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink">
          <Play size={14} aria-hidden />
        </span>
      </div>
      <div>
        <p className="m-0 mb-1 text-[11px] font-medium tracking-wide text-white/85">{t('continue.label')}</p>
        <h2 className="m-0 mb-0.5 font-display text-lg font-semibold text-white">{course.courseTitle}</h2>
        <p className="m-0 mb-3 text-xs text-white/85">{course.instructorName}</p>
        <ProgressBar value={course.progressPct} label={course.courseTitle} tone="onAccent" />
        <p className="m-0 mb-3 mt-1.5 text-[11px] text-white/85">{meta}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={learnHref(course)}
            className="btn-tactile inline-flex items-center rounded-md bg-highlight px-4 py-2 text-[13px] font-semibold text-ink no-underline hover:text-ink hover:brightness-95"
          >
            {t('continue.cta')}
          </Link>
          <Link
            href={`/courses/${course.courseSlug}`}
            className="rounded-md px-3 py-2 text-[13px] font-semibold text-white no-underline hover:bg-white/10 hover:text-white hover:no-underline"
          >
            {t('continue.details')}
          </Link>
        </div>
      </div>
    </section>
  );
}
