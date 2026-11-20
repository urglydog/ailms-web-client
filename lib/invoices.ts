import type { InvoiceStatus, InvoiceType } from '@/types/invoice';

/** Nhãn loại chứng từ cho NGƯỜI NHẬN (học viên/giảng viên) và cho admin dùng chung. */
export const INVOICE_TYPE_LABEL: Record<InvoiceType, string> = {
  RECEIPT: 'Biên lai thanh toán',
  REFUND: 'Phiếu hoàn tiền',
  PAYOUT: 'Phiếu chi rút tiền',
  DEBT_RECEIPT: 'Biên lai trả nợ',
  STATEMENT: 'Bảng kê thu nhập tháng',
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  ISSUED: 'Đã phát hành',
  VOIDED: 'Đã hủy',
};

/** Lưu Blob thành file trên máy người dùng (dùng cho PDF/CSV tải qua `apiBlob`). */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Màu nhãn theo loại chứng từ, để phân biệt nhanh trong danh sách mà không phải đọc cột "Loại". */
export const INVOICE_TYPE_CLASS: Record<InvoiceType, string> = {
  RECEIPT: 'border-success/30 bg-success-tint text-success-ink',
  REFUND: 'border-danger/40 bg-surface-raised text-danger',
  PAYOUT: 'border-accent/30 bg-tint text-accent-dark',
  DEBT_RECEIPT: 'border-warning bg-surface-raised text-ink',
  STATEMENT: 'border-line bg-line-soft text-ink',
};

/** Các trường trong dữ liệu chụp của chứng từ được hiển thị ở màn chi tiết, theo thứ tự và nhãn tiếng Việt; trường khác không hiển thị. */
export const INVOICE_DETAIL_FIELDS: { key: string; label: string; money?: boolean }[] = [
  { key: 'periodLabel', label: 'Kỳ bảng kê' },
  { key: 'orders', label: 'Số đơn trong kỳ' },
  { key: 'earnings', label: 'Thu nhập từ khóa học', money: true },
  { key: 'refundReversals', label: 'Trừ do hoàn tiền', money: true },
  { key: 'adjustments', label: 'Điều chỉnh', money: true },
  { key: 'debtRepayments', label: 'Đã trả nợ', money: true },
  { key: 'payoutsPaid', label: 'Đã rút trong kỳ', money: true },
  { key: 'platformShare', label: 'Phần nền tảng của các đơn này', money: true },
  { key: 'billingName', label: 'Họ tên thanh toán' },
  { key: 'billingPhone', label: 'Số điện thoại' },
  { key: 'paymentMethod', label: 'Phương thức thanh toán' },
  { key: 'gatewayTxnNo', label: 'Mã cổng thanh toán' },
  { key: 'orderRef', label: 'Mã đơn' },
  { key: 'originalReceipt', label: 'Biên lai gốc' },
  { key: 'payoutCode', label: 'Mã yêu cầu rút' },
  { key: 'bankName', label: 'Ngân hàng' },
  { key: 'accountMasked', label: 'Tài khoản nhận' },
  { key: 'holderName', label: 'Chủ tài khoản' },
  { key: 'orderCode', label: 'Mã thanh toán' },
  { key: 'transferRef', label: 'Mã giao dịch ngân hàng' },
  { key: 'transferredAt', label: 'Thời điểm chuyển tiền' },
];

/** Dòng giải thích phí chuyển tiền trên phiếu chi (tiếng Việt cho màn hình; PDF vẫn tiếng Anh). */
export const PAYOUT_FEE_NOTE = 'Phí chuyển tiền do LinguaLearn chi trả, không trừ vào số tiền bạn nhận.';
