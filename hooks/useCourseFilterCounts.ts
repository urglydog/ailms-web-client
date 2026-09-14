import { useQuery } from '@tanstack/react-query';
import { EMPTY_FILTERS, publicCoursesApi } from '@/lib/api/publicCourses';

/**
 * Số đếm cho từng lựa chọn trong bộ lọc kiểu Udemy (14/09/2026, mở rộng) — ví dụ "4.5 & up
 * (23)". Tải riêng 1 danh sách RỘNG (chỉ áp `keyword`, bỏ qua mọi bộ lọc khác đang chọn) để
 * tính đếm cho MỌI nhóm cùng lúc — khác Udemy thật (đếm theo đúng tổ hợp các bộ lọc khác đang
 * bật, cần hạ tầng facet search riêng). Đơn giản hoá có chủ đích, chấp nhận được ở quy mô
 * catalog hiện tại của đồ án — xem thêm ghi chú tương tự ở `CoursePublicService.search`.
 */
export function useCourseFilterCounts(keyword: string) {
  return useQuery({
    queryKey: ['courses', 'public', 'filter-counts', keyword],
    queryFn: () => publicCoursesApi.search({ ...EMPTY_FILTERS, keyword }, 'newest', 500),
    staleTime: 60_000,
  });
}
