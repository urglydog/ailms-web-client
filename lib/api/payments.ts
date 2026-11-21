import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { CreateBatchPaymentReq, PaymentRes, CreatePaymentReq, PaymentUrlRes } from '@/types/domain';

export interface MyPaymentsPage {
  items: PaymentRes[];
  total: number;
  page: number;
  size: number;
  /** Số giao dịch theo nhóm: ALL, SUCCESS, PENDING, FAILED, REFUNDED. */
  counts: Record<string, number>;
}

export const paymentsApi = {
  create: (req: CreatePaymentReq) =>
    api.post<PaymentUrlRes>('/api/v1/payments/create', req, { token: getAccessToken() ?? undefined }),

  /** Giỏ hàng (06/09/2026) — gộp thanh toán nhiều khóa đã chọn trong 1 lần checkout. */
  createBatch: (req: CreateBatchPaymentReq) =>
    api.post<PaymentUrlRes>('/api/v1/payments/create-batch', req, { token: getAccessToken() ?? undefined }),

  /** Học viên hủy ở PayOS — đánh dấu đơn PENDING của chính mình thành FAILED. */
  cancel: (orderCode: string) =>
    api.post<{ status: string }>(`/api/v1/payments/cancel?orderCode=${encodeURIComponent(orderCode)}`, {}, { token: getAccessToken() ?? undefined }),

  listMine: () =>
    api.get<PaymentRes[]>('/api/v1/payments/mine', { token: getAccessToken() ?? undefined }),

  /** Lịch sử giao dịch của chính mình: lọc nhóm trạng thái (SUCCESS/PENDING/FAILED/REFUNDED), khoảng ngày, từ khóa; phân trang; kèm số lượng từng nhóm. */
  searchMine: (params: { status?: string; q?: string; from?: string; to?: string; page: number; size?: number }) => {
    const p = new URLSearchParams({ page: String(params.page), size: String(params.size ?? 10) });
    if (params.status && params.status !== 'ALL') p.set('status', params.status);
    if (params.q?.trim()) p.set('q', params.q.trim());
    if (params.from) p.set('from', params.from);
    if (params.to) p.set('to', params.to);
    return api.get<MyPaymentsPage>(`/api/v1/payments/mine/search?${p.toString()}`, { token: getAccessToken() ?? undefined });
  },

  /** Tra cứu giao dịch cho admin: theo từ khóa (mã đơn, mã cổng, email/tên/ID người mua, khóa học) và/hoặc trạng thái; luôn phân trang. */
  searchAdmin: (q: string, status: string, page: number, size = 10) => {
    const p = new URLSearchParams({ page: String(page), size: String(size) });
    if (q.trim()) p.set('q', q.trim());
    if (status) p.set('status', status);
    return api.get<{ items: Record<string, unknown>[]; total: number; page: number; size: number }>(
      `/api/v1/payments/admin/search?${p.toString()}`,
      { token: getAccessToken() ?? undefined },
    );
  },
};
