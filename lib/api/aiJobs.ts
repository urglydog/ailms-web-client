import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { AiJobSummary, DubbingActivateResult, JobStatus, Page } from '@/types/domain';

/** UC45 — Admin only. */
export const aiJobsApi = {
  list: (status?: JobStatus, search?: string, page = 0) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    params.set('page', String(page));
    return api.get<Page<AiJobSummary>>(`/api/v1/admin/dubbing-jobs?${params.toString()}`, {
      token: getAccessToken() ?? undefined,
    });
  },

  retry: (id: number) =>
    api.post<DubbingActivateResult>(`/api/v1/admin/dubbing-jobs/${id}/retry`, undefined, {
      token: getAccessToken() ?? undefined,
    }),
};
