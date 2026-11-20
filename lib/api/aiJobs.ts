import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { AiJobSummary, DubbingActivateResult, JobStatus, Page } from '@/types/domain';

/** UC45 — Admin only. */
export const aiJobsApi = {
  /** {@code view = 'ATTENTION'}: chỉ job lỗi chưa có bản lồng tiếng thành công thay thế. */
  list: (p: { status?: JobStatus; view?: 'ATTENTION'; search?: string; from?: string; to?: string; page?: number }) => {
    const params = new URLSearchParams();
    if (p.status) params.set('status', p.status);
    if (p.view) params.set('view', p.view);
    if (p.search) params.set('search', p.search);
    if (p.from) params.set('from', p.from);
    if (p.to) params.set('to', p.to);
    params.set('page', String(p.page ?? 0));
    return api.get<Page<AiJobSummary>>(`/api/v1/admin/dubbing-jobs?${params.toString()}`, {
      token: getAccessToken() ?? undefined,
    });
  },

  retry: (id: number) =>
    api.post<DubbingActivateResult>(`/api/v1/admin/dubbing-jobs/${id}/retry`, undefined, {
      token: getAccessToken() ?? undefined,
    }),
};
