import { useQuery } from '@tanstack/react-query';
import { publicCoursesApi } from '@/lib/api/publicCourses';
import type { CourseFilterState, CourseSortBy } from '@/types/domain';

/** UC09 — public, không cần token. Trang chi tiết (`getBySlug`) fetch trực tiếp ở Server Component. */
export function useCourseSearch(filters: CourseFilterState, sortBy: CourseSortBy = 'newest') {
  return useQuery({
    queryKey: ['courses', 'public', filters, sortBy],
    queryFn: () => publicCoursesApi.search(filters, sortBy),
  });
}

/** UC11 — Học thử Preview, public không cần token. 403 nếu bài học không phải Preview. */
export function useLessonPlayer(lessonId: number) {
  return useQuery({
    queryKey: ['lessons', lessonId, 'player'],
    queryFn: () => publicCoursesApi.getLessonPlayer(lessonId),
    retry: false,
  });
}
