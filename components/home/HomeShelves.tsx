'use client';

import { useTranslations } from 'next-intl';
import type { CategoryShelfData } from '@/lib/home/categoryShelves';
import type { CourseSummary } from '@/types/domain';
import { CategoryTiles } from './CategoryTiles';
import { CourseShelf } from './CourseShelf';

interface HomeShelvesProps {
  newest: CourseSummary[];
  free: CourseSummary[];
  beginner: CourseSummary[];
  /** Mỗi danh mục đủ khóa có một kệ riêng ngay dưới lưới chủ đề. */
  categoryShelves?: CategoryShelfData[];
}

/** Các hàng khóa học dưới "Đang thịnh hành" (nền xen kẽ để dễ phân tách) và lưới chủ đề. */
export function HomeShelves({ newest, free, beginner, categoryShelves = [] }: HomeShelvesProps) {
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
      {categoryShelves.map((shelf, i) => (
        <CourseShelf
          key={shelf.slug}
          tone={i % 2 === 0 ? 'plain' : 'tint'}
          title={shelf.name}
          subtitle={t('byCategory.subtitle', { name: shelf.name })}
          href={`/courses?category=${shelf.slug}`}
          courses={shelf.courses}
        />
      ))}
    </>
  );
}
