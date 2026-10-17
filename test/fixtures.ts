import type { CourseSummary } from '@/types/domain';

export function makeCourse(id: number, overrides: Partial<CourseSummary> = {}): CourseSummary {
  return {
    id,
    title: `Khóa học ${id}`,
    slug: `khoa-hoc-${id}`,
    instructorName: 'Trần Thanh Hà',
    thumbnailUrl: null,
    level: 'BEGINNER',
    price: 199000,
    isFree: false,
    avgRating: 4.8,
    reviewCount: 12,
    totalLessons: 10,
    totalDurationSec: 3600,
    categorySlug: 'lap-trinh',
    langs: [],
    coverColorA: '#0891B2',
    coverColorB: '#0E7490',
    finalPrice: 199000,
    discountPercent: null,
    ...overrides,
  };
}
