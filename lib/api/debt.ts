import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

const token = () => ({ token: getAccessToken() ?? undefined });

export type DebtPaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';

export interface DebtCharge {
  note: string | null;
  amount: number;
  createdAt: string;
}

export interface DebtRepayment {
  id: number;
  amount: number;
  status: DebtPaymentStatus;
  checkoutUrl: string | null;
  /** Nội dung mã QR (VietQR) để vẽ QR ngay trên trang. */
  qrCode: string | null;
  createdAt: string;
  paidAt: string | null;
}

/**
 * `level`: 0 không nợ · 1 đang nợ (nhắc) · 2 quá hạn → không xuất bản khóa mới/không đăng ký quảng bá · 3 quá hạn dài → khóa tạm ngừng bán mới.
 * `paused`: đang khiếu nại hoàn tiền nên các hạn chế tạm dừng.
 */
export interface DebtStatus {
  debtAmount: number;
  debtSince: string | null;
  daysInDebt: number;
  level: number;
  restrictAfterDays: number;
  suspendAfterDays: number;
  paused: boolean;
  minRepay: number;
  recentCharges: DebtCharge[];
  pendingRepayments: DebtRepayment[];
}

export interface AdminDebt {
  instructorId: number;
  name: string;
  email: string;
  debtAmount: number;
  debtSince: string;
  daysInDebt: number;
  level: number;
}

/** Công nợ giảng viên (14/11/2026): xem, trả (một phần được) qua PayOS; admin xem danh sách và xóa nợ có lý do. */
export const debtApi = {
  status: () => api.get<DebtStatus>('/api/v1/instructor/finance/debt', token()),
  repay: (amount: number) => api.post<DebtRepayment>('/api/v1/instructor/finance/debt/repay', { amount }, token()),
  repayment: (id: number) => api.get<DebtRepayment>(`/api/v1/instructor/finance/debt/repayments/${id}`, token()),
};

export const adminDebtApi = {
  list: () => api.get<AdminDebt[]>('/api/v1/admin/finance/debts', token()),
  writeOff: (instructorId: number, reason: string) =>
    api.post<void>(`/api/v1/admin/finance/debts/${instructorId}/write-off`, { reason }, token()),
};
