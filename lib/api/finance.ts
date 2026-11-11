import { api, apiBlob } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type {
  AccountReveal,
  AdminPayout,
  ConfirmResult,
  FinanceSummary,
  LedgerEntry,
  LinkPayoutAccountReq,
  PayoutAccount,
  PayoutBank,
  PayoutRequest,
  PayoutStatus,
} from '@/types/finance';

const token = () => ({ token: getAccessToken() ?? undefined });

/** Thu nhập, tài khoản nhận tiền, rút tiền của giảng viên (11/11/2026, Giai đoạn C). */
export const financeApi = {
  summary: () => api.get<FinanceSummary>('/api/v1/instructor/finance/summary', token()),

  ledger: (page = 0, size = 30) =>
    api.get<LedgerEntry[]>(`/api/v1/instructor/finance/ledger?page=${page}&size=${size}`, token()),

  banks: () => api.get<PayoutBank[]>('/api/v1/instructor/payout-banks', token()),

  /** BE trả 204 khi chưa có tài khoản → `undefined`; TanStack Query không cho data undefined nên đổi thành null. */
  account: async (): Promise<PayoutAccount | null> =>
    (await api.get<PayoutAccount | undefined>('/api/v1/instructor/payout-account', token())) ?? null,

  linkAccount: (req: LinkPayoutAccountReq) =>
    api.post<PayoutAccount>('/api/v1/instructor/payout-account', req, token()),

  /** Xác nhận bằng token trong email (tài khoản nhận tiền hoặc yêu cầu rút). */
  confirm: (confirmToken: string) =>
    api.post<ConfirmResult>('/api/v1/instructor/finance/confirm', { token: confirmToken }, token()),

  payouts: () => api.get<PayoutRequest[]>('/api/v1/instructor/payouts', token()),

  /** `idempotencyKey`: sinh 1 lần cho mỗi lần bấm → bấm đúp không tạo 2 yêu cầu. */
  requestPayout: (amount: number, idempotencyKey: string) =>
    api.post<PayoutRequest>('/api/v1/instructor/payouts', { amount }, {
      ...token(),
      headers: { 'Idempotency-Key': idempotencyKey },
    }),

  cancelPayout: (id: number) => api.post<PayoutRequest>(`/api/v1/instructor/payouts/${id}/cancel`, {}, token()),
};

/** Admin duyệt/chi/từ chối yêu cầu rút tiền (11/11/2026). */
export const adminPayoutsApi = {
  list: (status?: PayoutStatus) =>
    api.get<AdminPayout[]>(`/api/v1/admin/payouts${status ? `?status=${status}` : ''}`, token()),

  approve: (id: number) => api.post<AdminPayout>(`/api/v1/admin/payouts/${id}/approve`, {}, token()),

  markPaid: (id: number, transferRef: string, proofUrl?: string) =>
    api.post<AdminPayout>(`/api/v1/admin/payouts/${id}/mark-paid`, { transferRef, proofUrl: proofUrl || undefined }, token()),

  reject: (id: number, reason: string) =>
    api.post<AdminPayout>(`/api/v1/admin/payouts/${id}/reject`, { reason }, token()),

  markFailed: (id: number, reason: string) =>
    api.post<AdminPayout>(`/api/v1/admin/payouts/${id}/mark-failed`, { reason }, token()),

  /** Mỗi lần xem số tài khoản đầy đủ đều được BE ghi nhật ký. */
  reveal: (id: number) => api.get<AccountReveal>(`/api/v1/admin/payouts/${id}/account`, token()),

  exportCsv: () => apiBlob('/api/v1/admin/payouts/export.csv'),
};
