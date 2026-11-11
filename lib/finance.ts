import type { LedgerEntryType, PayoutStatus } from '@/types/finance';

export const money = (n: number | null | undefined) => `${(n ?? 0).toLocaleString('vi-VN')}đ`;

export const dateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export const dateOnly = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN') : '—';

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  PENDING_EMAIL: 'Chờ xác nhận email',
  REQUESTED: 'Chờ duyệt',
  APPROVED: 'Đã duyệt, chờ chuyển khoản',
  PAID: 'Đã chuyển tiền',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã hủy',
  FAILED: 'Chuyển khoản thất bại',
};

export const PAYOUT_STATUS_CLASS: Record<PayoutStatus, string> = {
  PENDING_EMAIL: 'bg-surface-raised text-ink border-warning',
  REQUESTED: 'bg-tint text-accent-dark border-accent/30',
  APPROVED: 'bg-tint text-accent-dark border-accent/30',
  PAID: 'bg-success-tint text-success-ink border-success/30',
  REJECTED: 'bg-danger/10 text-danger border-danger/30',
  CANCELLED: 'bg-line-soft text-ink-muted border-line',
  FAILED: 'bg-danger/10 text-danger border-danger/30',
};

export const LEDGER_TYPE_LABEL: Record<LedgerEntryType, string> = {
  EARNING: 'Thu nhập từ đơn hàng',
  REFUND_REVERSAL: 'Trừ do hoàn tiền',
  PAYOUT_RESERVE: 'Giữ chỗ yêu cầu rút',
  PAYOUT_RELEASE: 'Trả lại khoản giữ chỗ',
  ADJUSTMENT: 'Điều chỉnh',
};

/**
 * Khóa chống gửi trùng cho mỗi lần bấm "Yêu cầu rút". `crypto.randomUUID` chỉ có ở ngữ cảnh bảo mật (HTTPS) và trình
 * duyệt mới; Safari cũ/webview cũ không có → dự phòng bằng chuỗi ngẫu nhiên (đủ cho mục đích chống bấm đúp).
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
