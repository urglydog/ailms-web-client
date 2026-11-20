import { api, apiFormData } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type {
  CreateSupportTicketReq,
  SupportStatus,
  SupportTicketAdminRes,
  UpdateSupportTicketReq,
} from '@/types/domain';

export const supportApi = {
  /** multipart giống `disputesApi.file` — field "request" là JSON, "files" (0-3 ảnh). PUBLIC: `apiFormData`
   * chỉ gắn Authorization khi có token nên khách chưa đăng nhập vẫn gửi được. */
  create: (req: CreateSupportTicketReq, files: File[] = []) => {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(req)], { type: 'application/json' }));
    files.forEach((file) => formData.append('files', file));
    return apiFormData<{ code: string }>('/api/v1/support/tickets', formData);
  },

  /** Yêu cầu hỗ trợ cho admin: lọc trạng thái, tìm theo mã/email/tiêu đề; chỉ lấy {@code size} dòng đầu (tăng size để xem thêm). */
  listAdmin: (status?: SupportStatus, q = '', size = 30) => {
    const p = new URLSearchParams({ page: '0', size: String(size) });
    if (status) p.set('status', status);
    if (q.trim()) p.set('q', q.trim());
    return api.get<SupportTicketAdminRes[]>(`/api/v1/admin/support/tickets?${p.toString()}`, { token: getAccessToken() ?? undefined });
  },

  openCount: () =>
    api.get<{ open: number }>('/api/v1/admin/support/tickets/open-count', { token: getAccessToken() ?? undefined }),

  update: (id: number, req: UpdateSupportTicketReq) =>
    api.patch<SupportTicketAdminRes>(`/api/v1/admin/support/tickets/${id}`, req, { token: getAccessToken() ?? undefined }),
};
