import { api, apiFormData } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type {
  DisputeAdminRes,
  DisputeRes,
  DisputeStatus,
  FileDisputeReq,
  ReopenDisputeReq,
  ResolveDisputeReq,
} from '@/types/domain';

export const disputesApi = {
  /** multipart (23/10/2026) — cho đính kèm minh chứng ảnh/video, field "request" là 1 phần JSON
   * (Blob content-type application/json) khớp `@RequestPart("request") DisputeDto.FileReq` phía
   * BE, field "files" (0-5 file) khớp `@RequestPart(value = "files", required = false)`. */
  file: (req: FileDisputeReq, files: File[] = []) => {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(req)], { type: 'application/json' }));
    files.forEach((file) => formData.append('files', file));
    return apiFormData<DisputeRes>('/api/v1/disputes', formData);
  },

  listMine: () =>
    api.get<DisputeRes[]>('/api/v1/disputes/mine', { token: getAccessToken() ?? undefined }),

  listAllAdmin: (status?: DisputeStatus) => {
    const query = status ? `?status=${status}` : '';
    return api.get<DisputeAdminRes[]>(`/api/v1/disputes/admin${query}`, { token: getAccessToken() ?? undefined });
  },

  resolve: (id: number, req: ResolveDisputeReq) =>
    api.post<DisputeAdminRes>(`/api/v1/disputes/admin/${id}/resolve`, req, { token: getAccessToken() ?? undefined }),

  /** User báo "chưa nhận được tiền" sau khi admin đã đánh dấu hoàn tiền (26/10/2026). */
  reopen: (id: number, req: ReopenDisputeReq) =>
    api.post<DisputeRes>(`/api/v1/disputes/mine/${id}/reopen`, req, { token: getAccessToken() ?? undefined }),
};
