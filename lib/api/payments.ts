import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { PaymentRes, CreatePaymentReq, PaymentUrlRes } from '@/types/domain';

export const paymentsApi = {
  create: (req: CreatePaymentReq) =>
    api.post<PaymentUrlRes>('/api/v1/payments/create', req, { token: getAccessToken() ?? undefined }),
  
  listMine: () =>
    api.get<PaymentRes[]>('/api/v1/payments/mine', { token: getAccessToken() ?? undefined }),

  listAllAdmin: () =>
    api.get<Record<string, unknown>[]>('/api/v1/payments/admin/all', { token: getAccessToken() ?? undefined }),
};
