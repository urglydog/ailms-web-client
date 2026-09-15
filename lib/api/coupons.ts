import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { Coupon, CouponPreviewReq, CouponPriceRes, CreateCouponReq, UpdateCouponReq } from '@/types/domain';

/**
 * Mã giảm giá kiểu Udemy (15/09/2026, mở rộng ngoài đặc tả gốc — UC55/UC56/UC57). Dùng
 * chung 1 endpoint `/api/v1/coupons/**` cho cả Admin (coupon toàn hệ thống) lẫn Instructor
 * (chỉ coupon khóa học của chính mình) — quyền hạn được backend tự phân theo role đăng
 * nhập (BR-COUPON-02/03/06), FE không cần biết đang là ai khi gọi API này.
 */
export const couponsApi = {
  listMine: () => api.get<Coupon[]>('/api/v1/coupons/mine', { token: getAccessToken() ?? undefined }),

  create: (req: CreateCouponReq) =>
    api.post<Coupon>('/api/v1/coupons', req, { token: getAccessToken() ?? undefined }),

  update: (id: number, req: UpdateCouponReq) =>
    api.put<Coupon>(`/api/v1/coupons/${id}`, req, { token: getAccessToken() ?? undefined }),

  remove: (id: number) =>
    api.delete<void>(`/api/v1/coupons/${id}`, { token: getAccessToken() ?? undefined }),

  /** Xem trước giá sau khi nhập mã ở giỏ hàng/thanh toán — không tạo giao dịch nào. */
  preview: (req: CouponPreviewReq) =>
    api.post<CouponPriceRes>('/api/v1/coupons/preview', req, { token: getAccessToken() ?? undefined }),

  /**
   * BR-COUPON-05 — giỏ hàng nhiều khóa: mỗi khóa tự resolve coupon TỐT NHẤT của riêng nó với
   * CÙNG 1 mã học viên nhập (khớp đúng cách `PaymentService.createBatchPayment` xử lý ở BE —
   * gọi `resolveBestPrice` riêng lẻ cho từng khóa trong vòng lặp). Gọi song song vì các preview
   * độc lập nhau, không có giao dịch nào được tạo.
   */
  previewMany: async (courseIds: number[], code: string): Promise<Map<number, CouponPriceRes>> => {
    const entries = await Promise.all(
      courseIds.map(async (courseId) => [courseId, await couponsApi.preview({ courseId, code })] as const),
    );
    return new Map(entries);
  },
};
