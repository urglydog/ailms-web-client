'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { InstructorCourseSummary } from '@/types/domain';

interface PendingCoursesProps {
  courses: InstructorCourseSummary[];
  /** Tổng số khóa chờ duyệt (có thể lớn hơn số dòng đang hiện). */
  total: number;
}

/** Khối "Khóa học chờ duyệt" của trang Tổng quan: các khóa gần nhất, mỗi dòng có nút Duyệt; kèm lối tới hàng đợi đầy đủ. */
export function PendingCourses({ courses, total }: PendingCoursesProps) {
  const t = useTranslations('admin.overview.pending');
  return (
    <section aria-labelledby="pending-title" className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
        <h2 id="pending-title" className="m-0 font-display text-[15px] font-bold text-ink">
          {t('title')}
        </h2>
        {total > 0 && (
          <Link href="/admin/moderation" className="text-[12.5px] font-semibold text-accent-dark no-underline hover:underline">
            {t('viewAll', { count: total })}
          </Link>
        )}
      </div>
      {courses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-ink-muted">
          <CheckCircle2 size={22} className="text-success" aria-hidden />
          {t('empty')}
        </div>
      ) : (
        <ul className="m-0 list-none p-0">
          {courses.map((course) => (
            <li key={course.id} className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-b-0">
              <div
                aria-hidden
                className="h-9 w-14 shrink-0 rounded-md bg-tint bg-cover bg-center"
                style={course.thumbnailUrl ? { backgroundImage: `url(${course.thumbnailUrl})` } : undefined}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold text-ink">{course.title}</div>
                <div className="truncate text-xs text-ink-muted">{course.categoryName}</div>
              </div>
              <Link
                href={`/admin/moderation/${course.id}`}
                aria-label={t('review', { title: course.title })}
                className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
              >
                {t('reviewShort')}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
