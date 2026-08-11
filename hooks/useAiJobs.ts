import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiJobsApi } from '@/lib/api/aiJobs';
import { getAccessToken } from '@/lib/auth/token';
import type { JobStatus } from '@/types/domain';

export function useAiJobs(status?: JobStatus) {
  return useQuery({
    queryKey: ['ai-jobs', status ?? 'ALL'],
    queryFn: () => aiJobsApi.list(status),
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
