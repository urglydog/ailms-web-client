'use client';

import { useTranslations } from 'next-intl';
import type { CourseStatus } from '@/types/domain';

const STATUS_CLASS: Record<CourseStatus, string> = {
  DRAFT: 'bg-surface text-ink-muted border border-line',
  PENDING: 'bg-white text-ink border border-highlight',
  PUBLISHED: 'bg-success-tint text-success-ink',
  REJECTED: 'bg-white text-danger border border-danger/40',
  ARCHIVED: 'bg-line-soft text-ink-muted',
};

/** Pill màu trạng thái khóa học — dùng chung ở cả trang Instructor lẫn Admin; nhãn dịch theo ngôn ngữ giao diện.
 * Chữ luôn đạt tương phản AA (nền trắng hoặc nhạt, viền thể hiện sắc thái). */
export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const t = useTranslations('instructor.courses.status');
  return (
    <span className={`w-fit whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASS[status]}`}>
      {t(status)}
    </span>
  );
}
