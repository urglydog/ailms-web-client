'use client';

import Link from 'next/link';
import { Globe, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { CourseDetail } from '@/types/domain';

/** Phần đầu trang chi tiết khóa học: đường dẫn, tên, mô tả, đánh giá, giảng viên và các ngôn ngữ đã lồng tiếng. */
export function CourseHero({ course }: { course: CourseDetail }) {
  const t = useTranslations('courseDetail');
  const locale = useLocale();
  const updated = new Date(course.updatedAt).toLocaleDateString(locale, { month: 'numeric', year: 'numeric' });

  return (
    <div className="border-b border-line bg-tint">
      <div className="shell flex flex-col gap-4 py-10">
        <nav aria-label={t('breadcrumbAria')} className="text-[13px] text-ink-muted">
          <Link href="/courses" className="font-semibold text-accent-dark no-underline hover:underline">
            {t('allCourses')}
          </Link>
          <span aria-hidden> / </span>
          <span>{course.title}</span>
        </nav>

        <h1 className="max-w-3xl font-display text-3xl font-extrabold leading-tight text-ink">{course.title}</h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-ink-muted">{course.description}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5 font-bold text-ink">
            {course.avgRating.toFixed(1)}
            <Star size={14} aria-hidden className="fill-star text-star" />
            <span className="font-normal text-ink-muted">({course.reviewCount.toLocaleString(locale)})</span>
          </span>
          <span className="text-ink-muted">{t('learners', { count: course.learnerCount.toLocaleString(locale) })}</span>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-accent-dark">
            {t(`level.${course.level}`)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-muted">
          <span>
            {t('instructor')} <span className="font-semibold text-ink">{course.instructorName}</span>
          </span>
          <span aria-hidden>·</span>
          <span>{t('updated', { date: updated })}</span>
          {course.sourceLanguage && (
            <>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1">
                <Globe size={14} aria-hidden />
                {course.sourceLanguage}
              </span>
            </>
          )}
        </div>

        {course.dubbedLanguages.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold text-ink">{t('dubbed')}</span>
            {course.dubbedLanguages.map((lang) => (
              <span
                key={lang}
                className="rounded-full border border-line bg-white px-2.5 py-1 text-[12.5px] text-accent-dark"
              >
                {lang}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
