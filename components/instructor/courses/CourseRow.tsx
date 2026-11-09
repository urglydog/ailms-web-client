'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CourseStatusBadge } from '@/components/course/CourseStatusBadge';
import { nextAction } from '@/lib/instructor/courseList';
import type { InstructorCourseSummary } from '@/types/domain';

interface CourseRowProps {
  course: InstructorCourseSummary;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  onRemove: (course: InstructorCourseSummary) => void;
  onReactivate: (id: number) => void;
}

/** Cột lưới dùng chung với dòng tiêu đề bảng ở trang danh sách (từ `md`); dưới `md` mỗi khóa là một thẻ xếp dọc. */
export const ROW_GRID = 'md:grid md:grid-cols-[28px_minmax(0,1.9fr)_120px_150px_minmax(0,1.3fr)_72px] md:items-center md:gap-4';

/** Một khóa học trong danh sách của giảng viên: ảnh, tên (vào trình chỉnh sửa), trạng thái, độ hoàn thiện và việc nên làm tiếp. */
export function CourseRow({ course, selected, onToggleSelect, onRemove, onReactivate }: CourseRowProps) {
  const t = useTranslations('instructor.courses');
  const action = nextAction(course);
  const editHref = `/instructor/courses/${course.id}/edit`;
  const done = course.completionPercent >= 100;

  return (
    <li className={`flex flex-col gap-3 border-b border-line-soft px-4 py-3 last:border-b-0 ${ROW_GRID}`}>
      <div className="flex items-center gap-3 md:contents">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(course.id)}
          aria-label={t('row.select', { title: course.title })}
          className="h-4 w-4 shrink-0 accent-accent"
        />

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative h-11 w-[72px] shrink-0 overflow-hidden rounded-md bg-tint">
            {course.thumbnailUrl && <Image src={course.thumbnailUrl} alt="" fill sizes="72px" className="object-cover" />}
          </div>
          <div className="min-w-0">
            <Link href={editHref} className="block truncate text-[13.5px] font-semibold text-ink no-underline hover:text-accent-dark">
              {course.title}
            </Link>
            <span className="block truncate text-xs text-ink-muted">
              {course.categoryName} · {t('row.lessons', { count: course.totalLessons })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-7 md:contents md:pl-0">
        <CourseStatusBadge status={course.status} />

        <div className="flex items-center gap-2" title={t('row.completion')}>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line-soft" role="presentation">
            <div className={`h-full rounded-full ${done ? 'bg-success' : 'bg-accent'}`} style={{ width: `${course.completionPercent}%` }} />
          </div>
          <span className="text-xs text-ink-muted">{course.completionPercent}%</span>
        </div>

        <div className="min-w-0 text-[12.5px]">
          {action === 'complete' || action === 'submit' || action === 'fixRejected' ? (
            <Link
              href={editHref}
              className="inline-flex rounded-full border border-accent px-3 py-1 font-semibold text-accent-dark no-underline hover:bg-tint"
            >
              {t(`next.${action}`)}
            </Link>
          ) : action === 'reactivate' ? (
            <button
              type="button"
              onClick={() => onReactivate(course.id)}
              className="inline-flex rounded-full border border-accent px-3 py-1 font-semibold text-accent-dark hover:bg-tint"
            >
              {t('next.reactivate')}
            </button>
          ) : (
            <span className="text-ink-muted">{t(`next.${action}`)}</span>
          )}
        </div>

        <div className="ml-auto flex items-center justify-end gap-1 md:ml-0">
          <Link
            href={editHref}
            title={t('row.edit')}
            aria-label={t('row.edit')}
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-tint hover:text-accent-dark"
          >
            <Pencil size={15} aria-hidden />
          </Link>
          {course.status !== 'ARCHIVED' && (
            <button
              type="button"
              onClick={() => onRemove(course)}
              title={t('row.remove')}
              aria-label={t('row.remove')}
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 size={15} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
