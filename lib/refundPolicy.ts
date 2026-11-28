import type { RefundReasonCode, RefundResponsibility } from '@/types/domain';

/** Mã lý do cho từng chế độ trách nhiệm — PHẢI khớp `RefundReasonCode.responsibility()` ở BE (BE luôn kiểm lại). */
export const REASON_CODES: Record<RefundResponsibility, RefundReasonCode[]> = {
  STANDARD: ['BUYER_REMORSE', 'OTHER'],
  PLATFORM_COMPENSATES: ['TECHNICAL_ISSUE', 'DOUBLE_CHARGE', 'NOT_ENROLLED', 'PLATFORM_FAULT'],
  INSTRUCTOR_FAULT: ['COPYRIGHT_VIOLATION', 'CONTENT_MISMATCH', 'PROHIBITED_CONTENT'],
};
