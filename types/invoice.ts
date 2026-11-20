export type InvoiceType = 'RECEIPT' | 'REFUND' | 'PAYOUT' | 'DEBT_RECEIPT';
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
