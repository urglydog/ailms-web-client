import { useQuery } from '@tanstack/react-query';
import { lessonPlayerApi } from '@/lib/api/lessonPlayer';
import { getAccessToken } from '@/lib/auth/token';

/**
 * UC16/17 — học viên ĐÃ đăng nhập. Chỉ gọi khi có JWT (`enabled`); trang học dùng song song với
 * `useLessonPlayer` (UC11, ẩn danh) — xem `learn/[lessonId]/page.tsx` để biết cách chọn kết quả.
 */
export function useEnrolledLessonPlayer(lessonId: number) {
  return useQuery({
    queryKey: ['lessons', lessonId, 'player', 'enrolled'],
    queryFn: () => lessonPlayerApi.getForPlayback(lessonId),
    enabled: !!getAccessToken(),
    retry: false,
  });
}
