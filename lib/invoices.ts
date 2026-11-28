import type { InvoiceType } from '@/types/invoice';

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

/** Các trường trong dữ liệu chụp của chứng từ được hiển thị ở màn chi tiết, theo thứ tự; nhãn dịch ở `finance.invoiceField.<key>`. Trường khác không hiển thị. */
export const INVOICE_DETAIL_FIELDS: { key: string; money?: boolean }[] = [
  { key: 'periodLabel' },
  { key: 'orders' },
  { key: 'earnings', money: true },
  { key: 'refundReversals', money: true },
  { key: 'adjustments', money: true },
  { key: 'debtRepayments', money: true },
  { key: 'payoutsPaid', money: true },
  { key: 'platformShare', money: true },
  { key: 'billingName' },
  { key: 'billingPhone' },
  { key: 'paymentMethod' },
  { key: 'gatewayTxnNo' },
  { key: 'orderRef' },
  { key: 'originalReceipt' },
  { key: 'payoutCode' },
  { key: 'bankName' },
  { key: 'accountMasked' },
  { key: 'holderName' },
  { key: 'orderCode' },
  { key: 'transferRef' },
  { key: 'transferredAt' },
];
