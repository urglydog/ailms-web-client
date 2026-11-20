import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiJobsApi } from '@/lib/api/aiJobs';
import { getAccessToken } from '@/lib/auth/token';
import type { JobStatus } from '@/types/domain';

export interface AiJobQuery {
  status?: JobStatus;
  view?: 'ATTENTION';
  search?: string;
  from?: string;
  to?: string;
  page?: number;
}

export function useAiJobs(query: AiJobQuery) {
  return useQuery({
    queryKey: ['ai-jobs', query],
    queryFn: () => aiJobsApi.list(query),
    enabled: !!getAccessToken(),
    placeholderData: (prev) => prev,
  });
}

export function useRetryAiJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => aiJobsApi.retry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-jobs'] }),
  });
}
