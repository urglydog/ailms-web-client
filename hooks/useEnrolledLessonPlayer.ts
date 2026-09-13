import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { lessonPlayerApi } from '@/lib/api/lessonPlayer';
import { getAccessToken } from '@/lib/auth/token';

/**
 * UC16/17 — học viên ĐÃ đăng nhập. Chỉ gọi khi có JWT (`enabled`); trang học dùng song song với
 * `useLessonPlayer` (UC11, ẩn danh) — xem `learn/[lessonId]/page.tsx` để biết cách chọn kết quả.
 *
 * `placeholderData: keepPreviousData` — khi học viên bấm sang bài khác (đổi `lessonId`), giữ
 * NGUYÊN dữ liệu bài cũ trên màn hình trong lúc chờ bài mới tải xong, thay vì `isLoading` bật lên
 * làm cả trang (sidebar/tab/video) biến mất rồi hiện lại — tham khảo Udemy: chỉ phần nội dung bài
 * học cập nhật, khung sườn trang đứng yên.
 */
export function useEnrolledLessonPlayer(lessonId: number) {
  return useQuery({
    queryKey: ['lessons', lessonId, 'player', 'enrolled'],
    queryFn: () => lessonPlayerApi.getForPlayback(lessonId),
    enabled: !!getAccessToken(),
    retry: false,
    placeholderData: keepPreviousData,
  });
}
