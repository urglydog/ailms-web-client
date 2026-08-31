import { useQuery } from '@tanstack/react-query';
import { liveViewApi } from '@/lib/api/liveView';

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
