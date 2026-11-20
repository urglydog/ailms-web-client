import { api, apiFormData } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { PayoutBank } from '@/types/finance';
import type {
  AppealDecideReq,
  DisputeAdminRes,
  DisputeRes,
  DisputeStatus,
  FileDisputeReq,
  InstructorDisputeRes,
  InstructorRespondReq,
  MarkTransferredReq,
  ReopenDisputeReq,
  RequestAccountUpdateReq,
  ResolveDisputeReq,
  UpdateRefundAccountReq,
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

  /** Danh sách khiếu nại cho admin: lọc trạng thái, tìm theo mã đơn/email/tên người gửi, phân trang (mặc định 30 dòng/trang). */
  listAllAdmin: (status?: DisputeStatus, q = '', page = 0, size = 30, needsAction = false) => {
    const p = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) p.set('status', status);
    if (needsAction) p.set('needsAction', 'true');
    if (q.trim()) p.set('q', q.trim());
    return api.get<DisputeAdminRes[]>(`/api/v1/disputes/admin?${p.toString()}`, { token: getAccessToken() ?? undefined });
  },

  /** Số khiếu nại đang cần admin xử lý (chưa xử lý/mở lại, đã duyệt hoàn chờ chuyển, hoặc kháng nghị đang chờ) — dùng cho huy hiệu menu, không tải danh sách. */
  openCount: () =>
    api.get<{ open: number }>('/api/v1/disputes/admin/open-count', { token: getAccessToken() ?? undefined }),

  resolve: (id: number, req: ResolveDisputeReq) =>
    api.post<DisputeAdminRes>(`/api/v1/disputes/admin/${id}/resolve`, req, { token: getAccessToken() ?? undefined }),

  /** User báo "chưa nhận được tiền" sau khi admin đã đánh dấu hoàn tiền (26/10/2026). */
  reopen: (id: number, req: ReopenDisputeReq) =>
    api.post<DisputeRes>(`/api/v1/disputes/mine/${id}/reopen`, req, { token: getAccessToken() ?? undefined }),

  /** Danh sách ngân hàng cho form khai báo tài khoản nhận hoàn tiền (chọn từ danh sách, không gõ tự do). */
  banks: () => api.get<PayoutBank[]>('/api/v1/disputes/banks', { token: getAccessToken() ?? undefined }),

  /** Admin quyết định khiếu nại của giảng viên với quyết định "giảng viên chịu toàn bộ" (14/11/2026). */
  decideAppeal: (id: number, req: AppealDecideReq) =>
    api.post<DisputeAdminRes>(`/api/v1/disputes/admin/${id}/appeal/decide`, req, { token: getAccessToken() ?? undefined }),

  /** Học viên cập nhật tài khoản nhận hoàn tiền (16/11/2026); BE quyết định được phép hay không theo trạng thái khoản hoàn. */
  updateRefundAccount: (id: number, req: UpdateRefundAccountReq) =>
    api.put<DisputeRes>(`/api/v1/disputes/mine/${id}/refund-account`, req, { token: getAccessToken() ?? undefined }),

  /** Admin yêu cầu học viên cập nhật tài khoản nhận hoàn tiền (16/11/2026). */
  requestAccountUpdate: (id: number, req: RequestAccountUpdateReq) =>
    api.post<DisputeAdminRes>(`/api/v1/disputes/admin/${id}/request-account-update`, req, { token: getAccessToken() ?? undefined }),

  /** Admin đã chuyển khoản tiền hoàn cho học viên và nhập mã giao dịch (11/11/2026). */
  markTransferred: (id: number, req: MarkTransferredReq) =>
    api.post<DisputeAdminRes>(`/api/v1/disputes/admin/${id}/mark-transferred`, req, { token: getAccessToken() ?? undefined }),
};

/** Giảng viên xem/phản hồi khiếu nại hoàn tiền thuộc khóa của mình (11/11/2026). */
export const instructorDisputesApi = {
  list: (status?: DisputeStatus) => {
    const query = status ? `?status=${status}` : '';
    return api.get<InstructorDisputeRes[]>(`/api/v1/instructor/disputes${query}`, { token: getAccessToken() ?? undefined });
  },

  /** multipart: part "request" (JSON) + part "files" (0–5 ảnh/video minh chứng). */
  respond: (id: number, req: InstructorRespondReq, files: File[] = []) => {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(req)], { type: 'application/json' }));
    files.forEach((file) => formData.append('files', file));
    return apiFormData<InstructorDisputeRes>(`/api/v1/instructor/disputes/${id}/respond`, formData);
  },

  /** Khiếu nại quyết định "giảng viên chịu toàn bộ" (một lần, trong hạn). */
  appeal: (id: number, reason: string) =>
    api.post<InstructorDisputeRes>(`/api/v1/instructor/disputes/${id}/appeal`, { reason }, { token: getAccessToken() ?? undefined }),
};
