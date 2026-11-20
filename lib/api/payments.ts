import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { CreateBatchPaymentReq, PaymentRes, CreatePaymentReq, PaymentUrlRes } from '@/types/domain';

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
