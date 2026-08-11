import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { AiJobSummary, DubbingActivateResult, JobStatus, Page } from '@/types/domain';

/** UC45 — Admin only. */
export const aiJobsApi = {
  list: (status?: JobStatus) => {
    const query = status ? `?status=${status}` : '';
    return api.get<Page<AiJobSummary>>(`/api/v1/admin/dubbing-jobs${query}`, {
      token: getAccessToken() ?? undefined,
    });
  },

  retry: (id: number) =>
    api.post<DubbingActivateResult>(`/api/v1/admin/dubbing-jobs/${id}/retry`, undefined, {
      token: getAccessToken() ?? undefined,
    }),
};
