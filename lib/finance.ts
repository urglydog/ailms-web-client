import type { LedgerEntryType, PayoutStatus } from '@/types/finance';

export const money = (n: number | null | undefined) => `${(n ?? 0).toLocaleString('vi-VN')}đ`;

export const dateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export const dateOnly = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN') : '—';

/** Nhãn cho ADMIN (người thực hiện chi tiền): "Đã chi" — admin là bên chi. */
export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  PENDING_EMAIL: 'Chờ xác nhận email',
  REQUESTED: 'Chờ duyệt',
  APPROVED: 'Đã duyệt, chờ chi',
  PAID: 'Đã chi',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã hủy',
  FAILED: 'Chi thất bại',
};

/**
 * Nhãn cho GIẢNG VIÊN (người NHẬN tiền) — viết từ góc nhìn người nhận: "Đã nhận tiền", không phải "Đã chuyển tiền" (nghe như giảng viên
 * chuyển cho ai đó). Hai bộ nhãn dùng chung bộ màu `PAYOUT_STATUS_CLASS`.
 */
export const INSTRUCTOR_PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  PENDING_EMAIL: 'Chờ xác nhận email',
  REQUESTED: 'Đang chờ duyệt',
  APPROVED: 'Đã duyệt · đang chuyển tiền',
  PAID: 'Đã nhận tiền',
  REJECTED: 'Không được chấp nhận',
  CANCELLED: 'Đã hủy',
  FAILED: 'Chưa chuyển được · đã hoàn số dư',
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
  PAYOUT_RESERVE: 'Rút tiền',
  PAYOUT_RELEASE: 'Hoàn số dư (rút không thành công)',
  ADJUSTMENT: 'Điều chỉnh',
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
