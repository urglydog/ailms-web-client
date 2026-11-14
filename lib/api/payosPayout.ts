import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

const token = () => ({ token: getAccessToken() ?? undefined });

export type PayosOrderStatus = 'PENDING' | 'SUBMITTED' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN';

export interface PayosStatus {
  /** Công tắc `PAYOS_PAYOUT_ENABLED` trong Cài đặt. */
  enabled: boolean;
  /** Số dư tài khoản chi PayOS (VND); null khi tắt hoặc không đọc được. */
  balance: number | null;
  balanceError: string | null;
  /** Trần số tiền cho một lệnh chi tự động. */
  maxAmount: number;
}

export interface PayosOrder {
  id: number;
  kind: 'INSTRUCTOR_PAYOUT' | 'DISPUTE_REFUND';
  entityId: number;
  attempt: number;
  referenceId: string;
  amount: number;
  accountLast4: string;
  status: PayosOrderStatus;
  payosState: string | null;
  resolvedAccountName: string | null;
  holderNameEntered: string | null;
  /** Tên ngân hàng trả về khác tên đã nhập — cần admin kiểm tra. */
  nameMismatch: boolean;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

/** Chi tự động qua PayOS (14/11/2026). Số tiền và tài khoản do máy chủ lấy từ DB, FE chỉ gửi mã yêu cầu. */
export const payosPayoutApi = {
  status: () => api.get<PayosStatus>('/api/v1/admin/payos-payout/status', token()),
  orders: (kind: PayosOrder['kind'], entityId: number) =>
    api.get<PayosOrder[]>(`/api/v1/admin/payos-payout/orders?kind=${kind}&entityId=${entityId}`, token()),
  transferPayout: (payoutId: number) =>
    api.post<PayosOrder>(`/api/v1/admin/payos-payout/instructor-payouts/${payoutId}/transfer`, {}, token()),
  transferRefund: (disputeId: number) =>
    api.post<PayosOrder>(`/api/v1/admin/payos-payout/disputes/${disputeId}/refund-transfer`, {}, token()),
};
