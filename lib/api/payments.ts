import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { CreateBatchPaymentReq, PaymentRes, CreatePaymentReq, PaymentUrlRes } from '@/types/domain';

export const paymentsApi = {
  create: (req: CreatePaymentReq) =>
    api.post<PaymentUrlRes>('/api/v1/payments/create', req, { token: getAccessToken() ?? undefined }),

  /** Giỏ hàng (06/09/2026) — gộp thanh toán nhiều khóa đã chọn trong 1 lần checkout. */
  createBatch: (req: CreateBatchPaymentReq) =>
    api.post<PaymentUrlRes>('/api/v1/payments/create-batch', req, { token: getAccessToken() ?? undefined }),

  listMine: () =>
    api.get<PaymentRes[]>('/api/v1/payments/mine', { token: getAccessToken() ?? undefined }),

  listAllAdmin: () =>
    api.get<Record<string, unknown>[]>('/api/v1/payments/admin/all', { token: getAccessToken() ?? undefined }),
};
