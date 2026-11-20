'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { useMyInvoices } from '@/hooks/useInvoices';
import { ApiError } from '@/lib/api/client';
import { invoicesApi } from '@/lib/api/invoices';
import { dateTime, money } from '@/lib/finance';
import { INVOICE_STATUS_LABEL, INVOICE_TYPE_LABEL, saveBlob } from '@/lib/invoices';
import type { Invoice, InvoiceType } from '@/types/invoice';

interface Props {
  title: string;
  /** Giới hạn loại hiển thị (vd giảng viên chỉ cần phiếu chi/biên lai nợ ở trang Thu nhập); bỏ trống = tất cả. */
  types?: InvoiceType[];
  emptyText: string;
}

/** Danh sách chứng từ của chính người dùng, có nút tải PDF. Dữ liệu và quyền do BE quyết định. */
export function InvoiceList({ title, types, emptyText }: Props) {
  const { data, isLoading, isError } = useMyInvoices();
  const [busyId, setBusyId] = useState<number | null>(null);
  const rows = (data ?? []).filter((i) => !types || types.includes(i.type));

  const download = async (inv: Invoice) => {
    setBusyId(inv.id);
    try {
      saveBlob(await invoicesApi.pdf(inv.id), `${inv.number}.pdf`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không tải được chứng từ. Vui lòng thử lại sau ít phút.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
      <h2 className="m-0 font-display text-base font-bold text-ink">{title}</h2>
      {isLoading ? (
        <p className="m-0 text-sm text-ink-muted">Đang tải...</p>
      ) : isError ? (
        <p role="alert" className="m-0 text-sm text-danger">Không tải được danh sách chứng từ. Vui lòng thử lại.</p>
      ) : rows.length === 0 ? (
        <p className="m-0 text-sm text-ink-muted">{emptyText}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
          {rows.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-mono text-xs text-ink-muted">{inv.number}</span>
                <span className="font-semibold text-ink">
                  {INVOICE_TYPE_LABEL[inv.type]} · {money(inv.total)}
                </span>
                <span className="text-xs text-ink-muted">
                  {dateTime(inv.issuedAt)}
                  {inv.relatedNumber ? ` · liên quan biên lai ${inv.relatedNumber}` : ''}
                  {inv.status === 'VOIDED' ? ` · ${INVOICE_STATUS_LABEL.VOIDED}` : ''}
                </span>
              </div>
              <button
                type="button"
                disabled={busyId === inv.id}
                onClick={() => download(inv)}
                title="Tải chứng từ dạng PDF"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-accent-dark hover:bg-tint disabled:opacity-50"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {busyId === inv.id ? 'Đang tải...' : 'PDF'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
