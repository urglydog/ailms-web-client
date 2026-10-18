import { useQuery } from '@tanstack/react-query';
import { EMPTY_FILTERS, publicCoursesApi } from '@/lib/api/publicCourses';
import type { CourseSummary } from '@/types/domain';

/** Khóa cùng danh mục (xếp theo điểm đánh giá), bỏ chính khóa đang xem. */
export function useRelatedCourses(categorySlug: string, courseId: number) {
  return useQuery<CourseSummary[]>({
    queryKey: ['courses', 'related', categorySlug, courseId],
    queryFn: async () => {
      const list = await publicCoursesApi.search({ ...EMPTY_FILTERS, category: categorySlug }, 'rating', 9);
      return list.filter((c) => c.id !== courseId);
    },
    staleTime: 60_000,
  });
}
