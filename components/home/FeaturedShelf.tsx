'use client';

import { useTranslations } from 'next-intl';
import type { CourseSummary } from '@/types/domain';
import { CourseShelf } from './CourseShelf';

/**
 * Kệ "Được đề xuất" ở trang chủ (11/11/2026, Giai đoạn E): các khóa do nền tảng chủ động đề xuất (đợt quảng bá đã duyệt). Tiêu đề
 * luôn ghi rõ "Được đề xuất" để học viên biết đây không phải xếp hạng thuần theo đánh giá. Không có khóa nào thì không vẽ gì.
 */
export function FeaturedShelf({ courses }: { courses: CourseSummary[] }) {
  const t = useTranslations('home.shelves.featured');
  return <CourseShelf tone="tint" title={t('title')} subtitle={t('subtitle')} href="/courses" courses={courses} />;
}
