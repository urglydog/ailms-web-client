import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { publicCoursesApi } from '@/lib/api/publicCourses';
import type { CourseFilterState, CourseSortBy } from '@/types/domain';

/** Số khóa tải thêm mỗi lần ở Kho khóa học (6 hàng × 4 cột trên màn rộng). */
export const BROWSE_PAGE_SIZE = 24;

/**
 * UC09 — public, không cần token. TẢI DẦN khi cuộn (infinite scroll, 08/11/2026): lần đầu lấy 24 khóa,
 * cuộn gần cuối thì lấy tiếp 24 khóa sau — không kéo cả kho về một lần nên dữ liệu lớn vẫn nhẹ.
 * Đổi bộ lọc/sắp xếp là một queryKey mới nên tự bắt đầu lại từ trang đầu.
 */
export function useCourseSearchInfinite(filters: CourseFilterState, sortBy: CourseSortBy) {
  return useInfiniteQuery({
    queryKey: ['courses', 'public', 'infinite', filters, sortBy, BROWSE_PAGE_SIZE],
    // `signal`: đổi bộ lọc khi request cũ chưa xong thì React Query hủy request đó (đỡ tải thừa cho server).
    queryFn: ({ pageParam, signal }) => publicCoursesApi.searchPage(filters, sortBy, pageParam, BROWSE_PAGE_SIZE, signal),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.hasNext ? all.length + 1 : undefined),
    // Giữ lưới cũ trên màn hình trong lúc tải kết quả lọc mới — không chớp trắng.
    placeholderData: keepPreviousData,
  });
}

/**
 * UC11 — Học thử Preview, public không cần token. 403 nếu bài học không phải Preview.
 *
 * `enabled` mặc định true — trang `learn/[lessonId]` tắt hẳn hook này khi đã đăng nhập
 * (dùng `useEnrolledLessonPlayer` thay thế), giữ đúng luồng khách xem thử dựng từ Giai đoạn 4.
 */
export function useLessonPlayer(lessonId: number, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['lessons', lessonId, 'player'],
    queryFn: () => publicCoursesApi.getLessonPlayer(lessonId),
    retry: false,
    enabled: options.enabled ?? true,
    // Giữ dữ liệu bài trước khi chuyển bài (xem `useEnrolledLessonPlayer`) — tránh cả trang chớp
    // trắng lúc đổi bài.
    placeholderData: keepPreviousData,
  });
}
