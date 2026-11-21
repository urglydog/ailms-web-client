import type { RefundReasonCode, RefundResponsibility } from '@/types/domain';

/** Mã lý do cho từng chế độ trách nhiệm — PHẢI khớp `RefundReasonCode.responsibility()` ở BE (BE luôn kiểm lại). */
export const REASON_CODES: Record<RefundResponsibility, RefundReasonCode[]> = {
  STANDARD: ['BUYER_REMORSE', 'OTHER'],
  PLATFORM_COMPENSATES: ['TECHNICAL_ISSUE', 'DOUBLE_CHARGE', 'NOT_ENROLLED', 'PLATFORM_FAULT'],
  INSTRUCTOR_FAULT: ['COPYRIGHT_VIOLATION', 'CONTENT_MISMATCH', 'PROHIBITED_CONTENT'],
};

export const REASON_LABEL: Record<RefundReasonCode, string> = {
  BUYER_REMORSE: 'Học viên đổi ý trong hạn',
  OTHER: 'Lý do khác (không ai có lỗi)',
  TECHNICAL_ISSUE: 'Lỗi kỹ thuật từ phía hệ thống',
  DOUBLE_CHARGE: 'Thanh toán trùng',
  NOT_ENROLLED: 'Đã trừ tiền nhưng không ghi danh',
  PLATFORM_FAULT: 'Lỗi từ phía nền tảng',
  COPYRIGHT_VIOLATION: 'Vi phạm bản quyền',
  CONTENT_MISMATCH: 'Nội dung sai khác nghiêm trọng so với mô tả',
  PROHIBITED_CONTENT: 'Nội dung bị cấm',
};

export const RESPONSIBILITY_LABEL: Record<RefundResponsibility, string> = {
  STANDARD: 'Chuẩn — giảng viên trả lại đúng phần đã nhận',
  PLATFORM_COMPENSATES: 'Nền tảng chịu toàn bộ',
  INSTRUCTOR_FAULT: 'Giảng viên chịu toàn bộ',
};
