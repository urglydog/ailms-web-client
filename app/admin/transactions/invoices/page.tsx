'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileDown, FileText, Mail, Table2, X } from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { Modal } from '@/components/ui/Modal';
import { Pager, SearchPanel, SearchPrompt } from '@/components/ui/SearchPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { adminInvoicesApi } from '@/lib/api/invoices';
import { getAccessToken } from '@/lib/auth/token';
import { dateTime, money } from '@/lib/finance';
import { INVOICE_TYPE_CLASS, saveBlob } from '@/lib/invoices';
import type { AdminInvoice, AdminInvoiceFilter, InvoiceType } from '@/types/invoice';

// Hiệu năng đợt 7 (B6): biểu đồ recharts trong chi tiết hóa đơn chỉ tải khi mở chi tiết.
const InvoiceDetailBody = dynamic(() => import('@/components/invoices/InvoiceDetailBody').then((m) => m.InvoiceDetailBody), { ssr: false });

const TYPES: InvoiceType[] = ['RECEIPT', 'REFUND', 'PAYOUT', 'DEBT_RECEIPT', 'STATEMENT'];
const PAGE_SIZE = 10;

/**
 * Chứng từ (tìm-kiếm-trước, 20/11/2026): không liệt kê sẵn. Admin nhập số chứng từ, mã đơn, email/tên/ID người nhận hoặc tên khóa học (và/hoặc chọn loại, khoảng ngày)
 * rồi bấm Tìm; bấm một kết quả để xem chi tiết và các thao tác (Chia sẻ: PDF, gửi lại email). Chứng từ bất biến — không sửa/xóa.
 */
export default function AdminInvoicesPage() {
  const t = useTranslations('admin.invoices');
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
      toast.error(t('needCriteria'));
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
      toast.success(t('resent'));
      qc.invalidateQueries({ queryKey: ['admin', 'invoice-detail', id] });
    } else {
      toast.error(t('resendFailed'));
    }
  };

  const inputCls = 'rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent';

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          criteria && data && data.total > 0 ? (
            <ExportMenu
              label={t('shareResults')}
              items={[
                {
                  id: 'csv',
                  label: t('csv'),
                  hint: t('csvHint'),
                  icon: <Table2 size={15} aria-hidden />,
                  onSelect: async () => saveBlob(await adminInvoicesApi.exportCsv(criteria), t('csvName')),
                },
              ]}
            />
          ) : undefined
        }
      />

      <SearchPanel
        label={t('search')}
        placeholder={t('searchPh')}
        value={input}
        onChange={setInput}
        onSubmit={search}
        busy={isFetching}
        filters={
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-muted">{t('typeLabel')}</span>
              <select value={typeInput} onChange={(e) => setTypeInput(e.target.value as InvoiceType | '')} className={inputCls}>
                <option value="">{t('allTypes')}</option>
                {TYPES.map((ty) => (
                  <option key={ty} value={ty}>{t(`type.${ty}`)}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-muted">{t('from')}</span>
              <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-muted">{t('to')}</span>
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={inputCls} />
            </label>
          </>
        }
      />

      {!criteria ? (
        <SearchPrompt title={t('promptTitle')}>
          {t('prompt')}
        </SearchPrompt>
      ) : isFetching && !data ? (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-raised p-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-6 text-center text-danger">{t('loadError')}</div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface-raised p-8 text-center text-ink-muted">{t('empty')}</div>
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
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${INVOICE_TYPE_CLASS[inv.type]}`}>{t(`type.${inv.type}`)}</span>
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
        <Modal open onClose={() => setOpenId(null)} bare ariaLabel={t('detail')} zClass="z-[400]" closeOnBackdrop={false}
          className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface-raised shadow-card-hover">
          <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
            <h2 className="m-0 font-display text-xl font-bold text-ink">{t('detail')}</h2>
            <div className="flex items-center gap-2">
              {detail && (
                <ExportMenu
                  items={[
                    { id: 'pdf', label: t('pdf'), hint: t('pdfHint'), icon: <FileDown size={15} aria-hidden />, onSelect: () => downloadPdf(detail.header) },
                    { id: 'mail', label: t('resend'), hint: t('resendHint', { email: detail.header.partyEmail }), icon: <Mail size={15} aria-hidden />, onSelect: () => resend(detail.header.id) },
                  ]}
                />
              )}
              <button type="button" onClick={() => setOpenId(null)} aria-label={t('close')} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-tint hover:text-ink">
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
            {t('immutable')}
          </div>
        </Modal>
      )}
    </>
  );
}
