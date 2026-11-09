'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatRelative } from '@/lib/myCourses/relativeTime';
import { certificateHref, learnHref, statusOf } from '@/lib/myCourses/model';
import type { EnrolledCourse } from '@/types/domain';

/** Dữ liệu dẫn xuất dùng chung cho thẻ và hàng khóa học: đích bấm thân thẻ, đích nút chứng chỉ, dòng "học gần nhất". */
export function useCourseItemData(course: EnrolledCourse) {
  const t = useTranslations('myCourses.card');
  const locale = useLocale();
  const completed = statusOf(course) === 'completed';
  return {
    completed,
    href: learnHref(course),
    certHref: completed ? certificateHref(course) : null,
    lastAccessed: course.lastAccessedAt
      ? t('lastAccessed', { time: formatRelative(course.lastAccessedAt, locale) })
      : t('neverAccessed'),
  };
}
