export type InvoiceType = 'RECEIPT' | 'REFUND' | 'PAYOUT' | 'DEBT_RECEIPT' | 'STATEMENT';
export type InvoiceStatus = 'ISSUED' | 'VOIDED';

/** Chứng từ của chính người dùng đăng nhập (`GET /api/v1/invoices`). */
export interface Invoice {
  id: number;
  number: string;
  type: InvoiceType;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  discount: number;
  total: number;
  issuedAt: string;
  relatedNumber: string | null;
  description: string | null;
  /** Mã nghiệp vụ chứng từ gắn vào: mã đơn, mã yêu cầu rút, mã thanh toán nợ, hoặc kỳ YYYYMM. */
  refs: string[];
}

/** Dòng trong danh sách quản trị (`GET /api/v1/admin/invoices`). */
export interface AdminInvoice {
  id: number;
  number: string;
  type: InvoiceType;
  status: InvoiceStatus;
  currency: string;
  total: number;
  issuedAt: string;
  partyUserId: number;
  partyName: string;
  partyEmail: string;
  relatedNumber: string | null;
  refs: string[];
}

export interface AdminInvoicePage {
  items: AdminInvoice[];
  total: number;
  page: number;
  size: number;
}

export interface AdminInvoiceFilter {
  type?: InvoiceType;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  size?: number;
}

export interface InvoiceLine {
  lineNo: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceSlice {
  label: string;
  amount: number;
}

/** Chi tiết một chứng từ: thông tin chung, các dòng, dữ liệu đã chụp và thành phần (thu nhập theo khóa của bảng kê tháng). */
export interface InvoiceDetail {
  header: AdminInvoice;
  subtotal: number;
  discount: number;
  lines: InvoiceLine[];
  details: Record<string, string | number>;
  breakdown: InvoiceSlice[];
}
