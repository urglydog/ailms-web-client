import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '@/lib/auth/token';
import { tutorInsightsApi } from '@/lib/api/tutorInsights';

/** Insight AI của 1 khoá — tự hỏi lại mỗi 5 giây khi tóm tắt AI đang được sinh nền. */
export function useTutorInsights(courseId: number | '') {
  return useQuery({
    queryKey: ['tutor-insights', courseId],
    queryFn: () => tutorInsightsApi.get(courseId as number),
    enabled: !!getAccessToken() && courseId !== '',
    refetchInterval: (query) => (query.state.data?.summary.status === 'PENDING' ? 5000 : false),
  });
}

export function useRefreshInsightSummary(courseId: number | '') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => tutorInsightsApi.refreshSummary(courseId as number),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tutor-insights', courseId] }),
  });
}
