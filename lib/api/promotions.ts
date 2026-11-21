import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { ApprovePromotionReq, CreatePromotionReq, PromotionRes, PromotionStatus } from '@/types/promotion';

const token = () => ({ token: getAccessToken() ?? undefined });

/** Giảng viên đăng ký/hủy quảng bá khóa của mình (11/11/2026, Giai đoạn E). */
export const instructorPromotionsApi = {
  list: () => api.get<PromotionRes[]>('/api/v1/instructor/promotions', token()),
  request: (req: CreatePromotionReq) => api.post<PromotionRes>('/api/v1/instructor/promotions', req, token()),
  cancel: (id: number) => api.post<PromotionRes>(`/api/v1/instructor/promotions/${id}/cancel`, {}, token()),
};

/** Admin duyệt/từ chối/kết thúc đợt quảng bá. */
export const adminPromotionsApi = {
  list: (status?: PromotionStatus) =>
    api.get<PromotionRes[]>(`/api/v1/admin/promotions${status ? `?status=${status}` : ''}`, token()),
  approve: (id: number, req: ApprovePromotionReq) => api.post<PromotionRes>(`/api/v1/admin/promotions/${id}/approve`, req, token()),
  reject: (id: number, reason: string) => api.post<PromotionRes>(`/api/v1/admin/promotions/${id}/reject`, { reason }, token()),
  end: (id: number, reason: string) => api.post<PromotionRes>(`/api/v1/admin/promotions/${id}/end`, { reason }, token()),
};
