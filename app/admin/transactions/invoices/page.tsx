'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileDown, FileText, Mail, Table2, X } from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceDetailBody } from '@/components/invoices/InvoiceDetailBody';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { Modal } from '@/components/ui/Modal';
import { Pager, SearchPanel, SearchPrompt } from '@/components/ui/SearchPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { adminInvoicesApi } from '@/lib/api/invoices';
import { getAccessToken } from '@/lib/auth/token';
import { dateTime, money } from '@/lib/finance';
import { INVOICE_TYPE_CLASS, INVOICE_TYPE_LABEL, saveBlob } from '@/lib/invoices';
import type { AdminInvoice, AdminInvoiceFilter, InvoiceType } from '@/types/invoice';

const TYPES: InvoiceType[] = ['RECEIPT', 'REFUND', 'PAYOUT', 'DEBT_RECEIPT', 'STATEMENT'];
const PAGE_SIZE = 10;

/**
 * Chứng từ (tìm-kiếm-trước, 20/11/2026): không liệt kê sẵn. Admin nhập số chứng từ, mã đơn, email/tên/ID người nhận hoặc tên khóa học (và/hoặc chọn loại, khoảng ngày)
 * rồi bấm Tìm; bấm một kết quả để xem chi tiết và các thao tác (Chia sẻ: PDF, gửi lại email). Chứng từ bất biến — không sửa/xóa.
 */
export default function AdminInvoicesPage() {
  const qc = useQueryClient();
  const [input, setInput] = useState('');
  const [typeInput, setTypeInput] = useState<InvoiceType | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [criteria, setCriteria] = useState<AdminInvoiceFilter | null>(null);
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);

  const filter: AdminInvoiceFilter = { ...(criteria ?? {}), page, size: PAGE_SIZE };
  const { data, isFetching, isError } = useQuery({
    queryKey: ['admin', 'invoices', filter],
    queryFn: () => adminInvoicesApi.list(filter),
    enabled: !!criteria && !!getAccessToken(),
  });
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'invoice-detail', openId],
    queryFn: () => adminInvoicesApi.detail(openId as number),
    enabled: openId !== null && !!getAccessToken(),
  });
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const search = () => {
    if (!input.trim() && !typeInput && !from && !to) {
      toast.error('Hãy nhập số chứng từ, mã đơn, email hoặc tên người nhận, tên khóa học (hoặc chọn loại, khoảng ngày) để tra cứu.');
      return;
    }
    setPage(0);
    setCriteria({ q: input || undefined, type: typeInput || undefined, from: from || undefined, to: to || undefined });
  };

  const downloadPdf = async (inv: Pick<AdminInvoice, 'id' | 'number'>) => {
    saveBlob(await adminInvoicesApi.pdf(inv.id), `${inv.number}.pdf`);
  };

  const resend = async (id: number) => {
    const res = await adminInvoicesApi.resendEmail(id);
    if (res.sent) {
      toast.success('Đã gửi lại chứng từ qua email cho người nhận.');
      qc.invalidateQueries({ queryKey: ['admin', 'invoice-detail', id] });
    } else {
      toast.error('Không gửi được: người nhận chưa có email hợp lệ để nhận thư.');
    }
  };

  const inputCls = 'rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent';

  return (
    <>
      <PageHeader
        title="Hóa đơn & chứng từ"
        subtitle="Tra cứu biên lai thanh toán, phiếu hoàn tiền, phiếu chi, biên lai trả nợ và bảng kê thu nhập tháng. Chứng từ không sửa hay xóa."
        action={
          criteria && data && data.total > 0 ? (
            <ExportMenu
              label="Chia sẻ kết quả"
              items={[
                {
                  id: 'csv',
                  label: 'Tải danh sách (CSV)',
                  hint: 'Toàn bộ kết quả của lần tìm này',
                  icon: <Table2 size={15} aria-hidden />,
                  onSelect: async () => saveBlob(await adminInvoicesApi.exportCsv(criteria), 'chung-tu.csv'),
                },
              ]}
            />
          ) : undefined
        }
      />

      <SearchPanel
        label="Tìm chứng từ"
        placeholder="Số chứng từ, mã đơn, email / tên / ID người nhận, tên khóa học..."
        value={input}
        onChange={setInput}
        onSubmit={search}
        busy={isFetching}
        filters={
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-muted">Loại chứng từ</span>
              <select value={typeInput} onChange={(e) => setTypeInput(e.target.value as InvoiceType | '')} className={inputCls}>
                <option value="">Tất cả loại</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{INVOICE_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-muted">Từ ngày</span>
              <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-muted">Đến ngày</span>
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={inputCls} />
            </label>
          </>
        }
      />

      {!criteria ? (
        <SearchPrompt title="Nhập thông tin để tra cứu chứng từ">
          Hệ thống phát hành rất nhiều chứng từ nên không hiển thị sẵn. Hãy nhập số chứng từ, mã đơn, email, tên hoặc ID người nhận, hoặc tên khóa học;
          bấm vào một kết quả để xem chi tiết, tải PDF hoặc gửi lại email cho người nhận.
        </SearchPrompt>
      ) : isFetching && !data ? (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-raised p-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-6 text-center text-danger">Không tải được kết quả. Vui lòng thử lại.</div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface-raised p-8 text-center text-ink-muted">Không có chứng từ nào khớp điều kiện tìm kiếm.</div>
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="m-0 flex list-none flex-col divide-y divide-line-soft overflow-hidden rounded-xl border border-line bg-surface-raised p-0 shadow-sm">
            {data.items.map((inv) => (
              <li key={inv.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(inv.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-tint"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-ink">{inv.number}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${INVOICE_TYPE_CLASS[inv.type]}`}>{INVOICE_TYPE_LABEL[inv.type]}</span>
                    </span>
                    <span className="truncate text-xs text-ink-muted">{inv.partyName} · {inv.partyEmail} · {dateTime(inv.issuedAt)}</span>
                  </span>
                  <span className="font-semibold text-ink">{money(inv.total)}</span>
                </button>
              </li>
            ))}
          </ul>
          <Pager page={page} totalPages={totalPages} total={data.total} onPage={setPage} />
        </div>
      )}

      {openId !== null && (
        <Modal open onClose={() => setOpenId(null)} bare ariaLabel="Chi tiết chứng từ" zClass="z-[400]" closeOnBackdrop={false}
          className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface-raised shadow-card-hover">
          <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
            <h2 className="m-0 font-display text-xl font-bold text-ink">Chi tiết chứng từ</h2>
            <div className="flex items-center gap-2">
              {detail && (
                <ExportMenu
                  items={[
                    { id: 'pdf', label: 'Tải PDF', hint: 'Bản chứng từ để lưu hoặc in', icon: <FileDown size={15} aria-hidden />, onSelect: () => downloadPdf(detail.header) },
                    { id: 'mail', label: 'Gửi lại qua email', hint: `Gửi cho ${detail.header.partyEmail}`, icon: <Mail size={15} aria-hidden />, onSelect: () => resend(detail.header.id) },
                  ]}
                />
              )}
              <button type="button" onClick={() => setOpenId(null)} aria-label="Đóng" className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-tint hover:text-ink">
                <X size={18} aria-hidden />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto p-6">
            {detailLoading || !detail ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6" />
                <Skeleton className="h-24" />
              </div>
            ) : (
              <InvoiceDetailBody detail={detail} />
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-line bg-surface px-6 py-3 text-xs text-ink-muted">
            <FileText size={14} aria-hidden />
            Chứng từ được lưu cố định; nếu có sai sót sẽ được hủy bằng phiếu điều chỉnh, không chỉnh sửa trực tiếp.
          </div>
        </Modal>
      )}
    </>
  );
}
