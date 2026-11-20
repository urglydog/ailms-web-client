'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiError } from '@/lib/api/client';
import { adminInvoicesApi } from '@/lib/api/invoices';
import { getAccessToken } from '@/lib/auth/token';
import { dateTime, money } from '@/lib/finance';
import { INVOICE_STATUS_LABEL, INVOICE_TYPE_LABEL, saveBlob } from '@/lib/invoices';
import type { AdminInvoice, AdminInvoiceFilter, InvoiceType } from '@/types/invoice';

const TYPES: InvoiceType[] = ['RECEIPT', 'REFUND', 'PAYOUT', 'DEBT_RECEIPT', 'STATEMENT'];
const PAGE_SIZE = 20;

/**
 * Quản lý chứng từ (20/11/2026, Hóa đơn H1): lọc theo loại/kỳ/người nhận, tải PDF từng chứng từ, xuất CSV theo bộ lọc đang xem.
 * Chứng từ bất biến — màn này chỉ xem/tải, không sửa. Quyền ADMIN do BE kiểm.
 */
export default function AdminInvoicesPage() {
  const [type, setType] = useState<InvoiceType | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState<number | 'csv' | null>(null);

  const filter: AdminInvoiceFilter = {
    type: type || undefined,
    from: from || undefined,
    to: to || undefined,
    q: q || undefined,
    page,
    size: PAGE_SIZE,
  };
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'invoices', filter],
    queryFn: () => adminInvoicesApi.list(filter),
    enabled: !!getAccessToken(),
  });

  const onError = (err: unknown) => toast.error(err instanceof ApiError ? err.message : 'Thao tác không thành công. Vui lòng thử lại.');

  const downloadPdf = async (inv: AdminInvoice) => {
    setBusy(inv.id);
    try {
      saveBlob(await adminInvoicesApi.pdf(inv.id), `${inv.number}.pdf`);
    } catch (err) {
      onError(err);
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = async () => {
    setBusy('csv');
    try {
      saveBlob(await adminInvoicesApi.exportCsv(filter), 'invoices.csv');
    } catch (err) {
      onError(err);
    } finally {
      setBusy(null);
    }
  };

  const reset = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHeader
        title="Hóa đơn & chứng từ"
        subtitle="Biên lai thanh toán, phiếu hoàn tiền, phiếu chi và biên lai trả nợ của toàn nền tảng. Chứng từ không sửa hay xóa; tài khoản demo không có chứng từ."
      />

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-line bg-surface-raised p-4">
        <label className="flex w-full flex-col gap-1.5 sm:w-52">
          <span className="text-xs font-semibold text-ink-muted">Loại chứng từ</span>
          <select
            value={type}
            onChange={(e) => reset(setType)(e.target.value as InvoiceType | '')}
            className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="">Tất cả</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>{INVOICE_TYPE_LABEL[t]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">Từ ngày</span>
          <input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)}
            className="rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">Đến ngày</span>
          <input type="date" value={to} onChange={(e) => reset(setTo)(e.target.value)}
            className="rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent" />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">Tìm theo số chứng từ, tên hoặc email</span>
          <input type="search" value={q} onChange={(e) => reset(setQ)(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent" />
        </label>
        <button
          type="button"
          disabled={busy === 'csv'}
          onClick={exportCsv}
          title="Tải CSV theo bộ lọc đang xem (tối đa 5.000 dòng)"
          className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-accent-dark hover:bg-tint disabled:opacity-50"
        >
          {busy === 'csv' ? 'Đang xuất...' : 'Xuất CSV'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-raised p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : isError || !data ? (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-6 text-center text-danger">
          Không tải được danh sách chứng từ. Vui lòng thử lại.
        </div>
      ) : data.items.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface-raised p-8 text-center text-ink-muted">Không có chứng từ nào khớp bộ lọc.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-3">Số chứng từ</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Người nhận</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3">Ngày phát hành</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {data.items.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 font-mono text-xs text-ink">
                    {inv.number}
                    {inv.relatedNumber && <div className="text-ink-muted">liên quan {inv.relatedNumber}</div>}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {INVOICE_TYPE_LABEL[inv.type]}
                    {inv.status === 'VOIDED' && <span className="ml-2 text-xs text-danger">{INVOICE_STATUS_LABEL.VOIDED}</span>}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {inv.partyName}
                    <div className="text-xs text-ink-muted">{inv.partyEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{money(inv.total)}</td>
                  <td className="px-4 py-3 text-ink-muted">{dateTime(inv.issuedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={busy === inv.id}
                      onClick={() => downloadPdf(inv)}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-accent-dark hover:bg-tint disabled:opacity-50"
                    >
                      {busy === inv.id ? 'Đang tải...' : 'PDF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-ink-muted">
            <span>{data.total} chứng từ · trang {page + 1}/{totalPages}</span>
            <div className="flex gap-2">
              <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-tint disabled:opacity-50">Trang trước</button>
              <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-tint disabled:opacity-50">Trang sau</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
