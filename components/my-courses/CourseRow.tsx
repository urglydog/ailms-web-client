'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { EnrolledCourse } from '@/types/domain';
import { CertificateLink } from './CertificateLink';
import { CourseThumb } from './CourseThumb';
import { useCourseItemData } from './useCourseItemData';

/** Khóa học dạng hàng (spec mục 6). Bấm bất kỳ chỗ nào trên hàng (liên kết trải rộng ở tên khóa) là vào khóa;
 * nút chứng chỉ nằm trên lớp riêng (`relative z-10`) nên bấm vào đó mở trang chứng chỉ, không vào khóa. */
export function CourseRow({ course }: { course: EnrolledCourse }) {
  const t = useTranslations('myCourses.card');
  const { completed, href, certHref, lastAccessed } = useCourseItemData(course);

  return (
    <div
      className="group relative grid grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-4 rounded-card border border-line bg-surface-raised p-2.5
                 transition-[transform,box-shadow,border-color] duration-200 ease-soft
                 hover:-translate-y-0.5 hover:border-accent hover:shadow-card-hover
                 has-[.cert-link:hover]:translate-y-0 has-[.cert-link:hover]:border-line has-[.cert-link:hover]:shadow-none"
    >
      <CourseThumb thumbnailUrl={course.thumbnailUrl} title={course.courseTitle} className="aspect-[16/10] rounded-md" />

      <div className="min-w-0">
        <h3 className="m-0 mb-1 text-[13px]">
          <Link
            href={href}
            className="font-display font-semibold text-ink no-underline after:absolute after:inset-0 after:content-[''] hover:text-ink hover:no-underline"
          >
            {course.courseTitle}
          </Link>
        </h3>
        <p className="m-0 mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${
              completed ? 'bg-success-tint text-success-ink' : 'bg-tint text-accent-dark'
            }`}
          >
            {completed ? t('completed') : course.categoryName}
          </span>
          <span>{t('byInstructor', { name: course.instructorName })}</span>
          <span aria-hidden>·</span>
          <span>{lastAccessed}</span>
        </p>
        <div className="flex items-center gap-2">
          <ProgressBar
            value={course.progressPct}
            label={course.courseTitle}
            tone={completed ? 'success' : 'accent'}
            className="max-w-[260px]"
          />
          <span className="text-[11px] text-ink-muted">{Math.round(course.progressPct)}%</span>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2">
        {completed ? (
          certHref && <CertificateLink href={certHref} />
        ) : (
          <span className="text-xs font-semibold text-accent-dark">{t('continue')}</span>
        )}
      </div>
    </div>
  );
}
