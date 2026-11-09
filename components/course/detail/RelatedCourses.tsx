'use client';

import { useTranslations } from 'next-intl';
import { CourseShelf } from '@/components/home/CourseShelf';
import { useRelatedCourses } from '@/hooks/useRelatedCourses';

/** Hàng "Khóa học liên quan" cuối trang chi tiết: cùng danh mục, bỏ khóa đang xem và khóa đã sở hữu. */
export function RelatedCourses({ categorySlug, courseId }: { categorySlug: string; courseId: number }) {
  const t = useTranslations('courseDetail.related');
  const { data } = useRelatedCourses(categorySlug, courseId);
  if (!data) return null;
  return <CourseShelf tone="tint" title={t('title')} subtitle={t('subtitle')} href={`/courses?category=${categorySlug}`} courses={data} />;
}
