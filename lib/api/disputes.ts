import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { DisputeAdminRes, DisputeRes, DisputeStatus, FileDisputeReq, ResolveDisputeReq } from '@/types/domain';

export const disputesApi = {
  file: (req: FileDisputeReq) =>
    api.post<DisputeRes>('/api/v1/disputes', req, { token: getAccessToken() ?? undefined }),

  listMine: () =>
    api.get<DisputeRes[]>('/api/v1/disputes/mine', { token: getAccessToken() ?? undefined }),

  listAllAdmin: (status?: DisputeStatus) => {
    const query = status ? `?status=${status}` : '';
    return api.get<DisputeAdminRes[]>(`/api/v1/disputes/admin${query}`, { token: getAccessToken() ?? undefined });
  },

  resolve: (id: number, req: ResolveDisputeReq) =>
    api.post<DisputeAdminRes>(`/api/v1/disputes/admin/${id}/resolve`, req, { token: getAccessToken() ?? undefined }),
};
