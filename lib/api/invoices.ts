import { api, apiBlob } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { AdminInvoiceFilter, AdminInvoicePage, Invoice, InvoiceDetail } from '@/types/invoice';

const token = () => ({ token: getAccessToken() ?? undefined });

/** Chứng từ của chính mình: danh sách + tải PDF (BE chỉ trả chứng từ của người đăng nhập). */
export const invoicesApi = {
  listMine: () => api.get<Invoice[]>('/api/v1/invoices', token()),
  detail: (id: number) => api.get<InvoiceDetail>(`/api/v1/invoices/${id}`, token()),
  pdf: (id: number) => apiBlob(`/api/v1/invoices/${id}/pdf`),
};

function query(filter: AdminInvoiceFilter): string {
  const p = new URLSearchParams();
  if (filter.type) p.set('type', filter.type);
  if (filter.from) p.set('from', filter.from);
  if (filter.to) p.set('to', filter.to);
  if (filter.q?.trim()) p.set('q', filter.q.trim());
  if (filter.page !== undefined) p.set('page', String(filter.page));
  if (filter.size !== undefined) p.set('size', String(filter.size));
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** Admin: lọc theo loại/kỳ/người, tải PDF, xuất CSV theo đúng bộ lọc đang xem. */
export const adminInvoicesApi = {
  list: (filter: AdminInvoiceFilter) => api.get<AdminInvoicePage>(`/api/v1/admin/invoices${query(filter)}`, token()),
  detail: (id: number) => api.get<InvoiceDetail>(`/api/v1/admin/invoices/${id}`, token()),
  pdf: (id: number) => apiBlob(`/api/v1/admin/invoices/${id}/pdf`),
  resendEmail: (id: number) => api.post<{ sent: boolean }>(`/api/v1/admin/invoices/${id}/resend-email`, {}, token()),
  exportCsv: (filter: AdminInvoiceFilter) =>
    apiBlob(`/api/v1/admin/invoices/export.csv${query({ type: filter.type, from: filter.from, to: filter.to, q: filter.q })}`),
};
