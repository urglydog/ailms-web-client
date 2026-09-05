import { useQuery } from '@tanstack/react-query';
import { liveViewApi } from '@/lib/api/liveView';
import { getAccessToken } from '@/lib/auth/token';

/** Không gate theo `getAccessToken()` như `useMyCourses` — Guest cũng phải gọi được (UC51). */
export function useLiveSessionsForCourse(courseId: number | undefined) {
  return useQuery({
    queryKey: ['live-view', 'course', courseId],
    queryFn: () => liveViewApi.listForCourse(courseId as number),
    enabled: !!courseId,
    // Tự làm mới để "sắp live" chuyển "đang live" không cần bấm F5.
    refetchInterval: 30000,
  });
}

export function useLiveSessionView(sessionId: number | undefined) {
  return useQuery({
    queryKey: ['live-view', 'session', sessionId],
    queryFn: () => liveViewApi.view(sessionId as number),
    enabled: !!sessionId,
    refetchInterval: (query) => (query.state.data?.status === 'SCHEDULED' ? 30000 : false),
  });
}

/** F11.9 — tab "Công khai" trang `/live`. Guest gọi được — không gate theo token. Poll 30s để bắt
 * kịp phiên chuyển SCHEDULED -> LIVE mà không cần bấm F5 (chậm hơn poll 5s của badge người nghe —
 * đây là trang danh sách, không cần mượt bằng số đếm). */
export function usePublicLiveFeed() {
  return useQuery({
    queryKey: ['live-view', 'feed', 'public'],
    queryFn: () => liveViewApi.listPublicFeed(),
    refetchInterval: 30000,
  });
}

/** F11.9 — tab "Khóa học của tôi". `enabled: false` khi chưa đăng nhập — trang tự hiện khối mời
 * đăng nhập thay vì gọi API rồi nhận 401 (xem `app/(public)/live/page.tsx`). */
export function useEnrolledLiveFeed() {
  const isAuthenticated = !!getAccessToken();
  return useQuery({
    queryKey: ['live-view', 'feed', 'enrolled'],
    queryFn: () => liveViewApi.listEnrolledFeed(),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
}
