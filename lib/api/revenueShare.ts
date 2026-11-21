import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

/** Chính sách chia doanh thu/hoàn tiền/chi trả đang áp dụng (cấu hình admin) — chỉ giảng viên/admin đã đăng nhập đọc được. */
export interface RevenueShare {
  organicInstructorPct: number;
  referralInstructorPct: number;
  refundWindowDays: number;
  holdDays: number;
  minPayoutAmount: number;
  payoutDaysOfMonth: string;
}

export const revenueShareApi = {
  get: () => api.get<RevenueShare>('/api/v1/instructor/revenue-share', { token: getAccessToken() ?? undefined }),
};
