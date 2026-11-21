/** Chương trình quảng bá của nền tảng (11/11/2026, Epic hoàn tiền – chi trả, Giai đoạn E). */

export type PromotionPlacement = 'HOME_FEATURED' | 'CATEGORY_FEATURED';
export type PromotionStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ENDED';

export interface PromotionRes {
  id: number;
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  placement: PromotionPlacement;
  status: PromotionStatus;
  requestNote: string | null;
  startAt: string | null;
  endAt: string | null;
  adminNote: string | null;
  createdAt: string;
  /** Đang hiển thị thật cho học viên ngay lúc này. */
  active: boolean;
  /** Hiệu quả ước tính: đơn/doanh thu trong thời gian chạy so với khoảng bằng nhau ngay trước đó (không phải quy kết chính xác). */
  ordersDuring: number;
  revenueDuring: number;
  ordersBefore: number;
  revenueBefore: number;
  /** Chỉ admin mới có. */
  instructorName: string | null;
  instructorEmail: string | null;
}

export interface CreatePromotionReq {
  courseId: number;
  placement: PromotionPlacement;
  note?: string;
}

export interface ApprovePromotionReq {
  startAt?: string;
  endAt: string;
  note?: string;
}

export const PROMOTION_STATUS_LABEL: Record<PromotionStatus, string> = {
  REQUESTED: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã hủy',
  ENDED: 'Đã kết thúc',
};

export const PROMOTION_PLACEMENT_LABEL: Record<PromotionPlacement, string> = {
  HOME_FEATURED: 'Kệ "Được đề xuất" trang chủ',
  CATEGORY_FEATURED: 'Đầu trang danh mục',
};
