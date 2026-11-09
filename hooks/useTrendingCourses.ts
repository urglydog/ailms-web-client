import { useQuery } from '@tanstack/react-query';
import { EMPTY_FILTERS, publicCoursesApi } from '@/lib/api/publicCourses';
import { TRENDING_FETCH_SIZE } from '@/lib/home/trending';
import type { CourseSummary } from '@/types/domain';

/** Khóa học "Đang thịnh hành" theo danh mục. Tạm xếp theo điểm đánh giá (`rating`), như trang chủ cũ;
 * `initialData` chỉ áp cho tab "Tất cả" (dữ liệu server đã lấy sẵn). */
export function useTrendingCourses(categorySlug: string | null, initialData?: CourseSummary[]) {
  return useQuery<CourseSummary[]>({
    queryKey: ['courses', 'trending', categorySlug],
    queryFn: () =>
      publicCoursesApi.search({ ...EMPTY_FILTERS, category: categorySlug }, 'rating', TRENDING_FETCH_SIZE),
    initialData: categorySlug === null ? initialData : undefined,
    staleTime: 60_000,
  });
}
