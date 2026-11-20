import type { InvoiceStatus, InvoiceType } from '@/types/invoice';

/** Nhãn loại chứng từ cho NGƯỜI NHẬN (học viên/giảng viên) và cho admin dùng chung. */
export const INVOICE_TYPE_LABEL: Record<InvoiceType, string> = {
  RECEIPT: 'Biên lai thanh toán',
  REFUND: 'Phiếu hoàn tiền',
  PAYOUT: 'Phiếu chi rút tiền',
  DEBT_RECEIPT: 'Biên lai trả nợ',
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
