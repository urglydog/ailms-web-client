import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiJobsApi } from '@/lib/api/aiJobs';
import { getAccessToken } from '@/lib/auth/token';
import type { JobStatus } from '@/types/domain';

export function useAiJobs(status?: JobStatus, search?: string, page = 0) {
  return useQuery({
    queryKey: ['ai-jobs', status ?? 'ALL', search ?? '', page],
    queryFn: () => aiJobsApi.list(status, search, page),
    enabled: !!getAccessToken(),
  });
}

export function useRetryAiJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => aiJobsApi.retry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-jobs'] }),
  });
}
