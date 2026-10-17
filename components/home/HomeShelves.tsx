'use client';

import { useTranslations } from 'next-intl';
import type { CourseSummary } from '@/types/domain';
import { CategoryTiles } from './CategoryTiles';
import { CourseShelf } from './CourseShelf';

interface HomeShelvesProps {
  newest: CourseSummary[];
  free: CourseSummary[];
  beginner: CourseSummary[];
}

/** Các hàng khóa học dưới "Đang thịnh hành" (nền xen kẽ để dễ phân tách) và lưới chủ đề. */
export function HomeShelves({ newest, free, beginner }: HomeShelvesProps) {
  const t = useTranslations('home.shelves');
  return (
    <>
      <CourseShelf
        tone="tint"
        title={t('newest.title')}
        subtitle={t('newest.subtitle')}
        href="/courses"
        courses={newest}
      />
      <CourseShelf title={t('free.title')} subtitle={t('free.subtitle')} href="/courses" courses={free} />
      <CourseShelf
        tone="tint"
        title={t('beginner.title')}
        subtitle={t('beginner.subtitle')}
        href="/courses"
        courses={beginner}
      />
      <CategoryTiles />
    </>
  );
}
