'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { EnrolledCourse } from '@/types/domain';
import { CertificateLink } from './CertificateLink';
import { CourseThumb } from './CourseThumb';
import { useCourseItemData } from './useCourseItemData';

/** Khóa học dạng thẻ gọn, 3 khóa mỗi hàng (spec mục 6). Cùng quy tắc hai hành động như {@link CourseRow}. */
export function CourseTile({ course }: { course: EnrolledCourse }) {
  const t = useTranslations('myCourses.card');
  const { completed, href, certHref, lastAccessed } = useCourseItemData(course);

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface-raised
                 transition-[transform,box-shadow,border-color] duration-[250ms] ease-soft
                 hover:-translate-y-1 hover:border-accent hover:shadow-card-hover
                 has-[.cert-link:hover]:translate-y-0 has-[.cert-link:hover]:border-line has-[.cert-link:hover]:shadow-none"
    >
      <div className="relative">
        <CourseThumb thumbnailUrl={course.thumbnailUrl} title={course.courseTitle} className="aspect-[16/9]" />
        <span
          className={`absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium shadow-sm ${
            completed ? 'text-success-ink' : 'text-accent-dark'
          }`}
        >
          {completed ? t('completed') : course.categoryName}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="m-0 text-[13px]">
          <Link
            href={href}
            className="line-clamp-2 font-display font-semibold text-ink no-underline after:absolute after:inset-0 after:content-[''] hover:text-ink hover:no-underline"
          >
            {course.courseTitle}
          </Link>
        </h3>
        <p className="m-0 text-[11px] text-ink-muted">{t('byInstructor', { name: course.instructorName })}</p>
        <p className="m-0 mb-1 text-[11px] text-ink-muted">{lastAccessed}</p>
        <ProgressBar value={course.progressPct} label={course.courseTitle} tone={completed ? 'success' : 'accent'} />
        <div className="relative z-10 mt-2 flex min-h-[28px] items-center justify-between">
          <span className="text-[11px] text-ink-muted">{Math.round(course.progressPct)}%</span>
          {completed ? (
            certHref && <CertificateLink href={certHref} />
          ) : (
            <span className="text-xs font-semibold text-accent-dark">{t('continue')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
