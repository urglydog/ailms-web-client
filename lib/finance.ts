import type { PayoutStatus } from '@/types/finance';

export const money = (n: number | null | undefined) => `${(n ?? 0).toLocaleString('vi-VN')}đ`;

export const dateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export const dateOnly = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN') : '—';

/** Nhãn trạng thái phía giảng viên (người NHẬN tiền) nằm ở `finance.instructorPayoutStatus.<status>`, dùng chung bộ màu dưới đây. */
export const PAYOUT_STATUS_CLASS: Record<PayoutStatus, string> = {
  PENDING_EMAIL: 'bg-surface-raised text-ink border-warning',
  REQUESTED: 'bg-tint text-accent-dark border-accent/30',
  APPROVED: 'bg-tint text-accent-dark border-accent/30',
  PAID: 'bg-success-tint text-success-ink border-success/30',
  REJECTED: 'bg-danger/10 text-danger border-danger/30',
  CANCELLED: 'bg-line-soft text-ink-muted border-line',
  FAILED: 'bg-danger/10 text-danger border-danger/30',
};

/**
 * Ghi chú của một dòng sổ cái. Các dòng cũ lưu câu "Giữ chỗ yêu cầu rút PO-…" / "Trả lại khoản giữ chỗ yêu cầu rút PO-…" (khó hiểu với giảng viên);
 * đổi sang cách nói đúng nghiệp vụ khi hiển thị, không cần sửa dữ liệu đã lưu. Dòng mới đã được BE ghi bằng câu mới.
 */
export function ledgerNote(note: string | null | undefined): string {
  if (!note) return '';
  return note
    .replace(/^Trả lại khoản giữ chỗ yêu cầu rút (\S+)$/, 'Hoàn số dư yêu cầu rút $1 (không thành công)')
    .replace(/^Giữ chỗ yêu cầu rút (\S+)$/, 'Yêu cầu rút tiền $1');
}

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
