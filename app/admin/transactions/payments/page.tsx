'use client';

import { Modal } from '@/components/ui/Modal';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, X } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { Pager, SearchPanel, SearchPrompt } from '@/components/ui/SearchPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiError } from '@/lib/api/client';
import { adminInvoicesApi } from '@/lib/api/invoices';
import { paymentsApi } from '@/lib/api/payments';
import { getAccessToken } from '@/lib/auth/token';
import { saveBlob } from '@/lib/invoices';
import { formatMoney } from '@/lib/shop/money';

export interface AdminPayment {
  txnRef: string;
  userEmail: string;
  courseTitle: string;
  amount: number;
  platformFee: number;
  instructorEarning: number;
  paymentMethod: string;
  status: string;
  paidAt: string | null;
  gatewayTxnNo: string | null;
  billingName?: string;
  billingPhone?: string;
  /** Mã giảm giá (15/09/2026, mở rộng) — null nếu giao dịch không dùng coupon nào. */
  originalAmount: number | null;
  discountAmount: number;
  couponCode: string | null;
  /** Chia doanh thu 2 mức (20/09/2026) — quyết định tỷ lệ ĐÃ áp dụng cho platformFee/instructorEarning ở trên. */
  revenueSource: 'ORGANIC' | 'INSTRUCTOR_REFERRAL';
  /** Tỷ lệ phần nền tảng THỰC TẾ đã áp dụng (0–1, chốt lúc PAID) — null với đơn chưa PAID/0đ (11/11/2026). */
  platformRate?: number | null;
}

/** % phần nền tảng của 1 đơn: ưu tiên tỷ lệ đã chốt trong DB (tỷ lệ là cấu hình admin nên đổi được),
 * chỉ dùng giá trị mặc định cũ khi đơn chưa có `platformRate`. */
function platformPercent(p: AdminPayment): number {
  if (p.platformRate != null) return Math.round(p.platformRate * 10000) / 100;
  return p.revenueSource === 'INSTRUCTOR_REFERRAL' ? 3 : 63;
}

const STATUSES = ['PAID', 'PENDING', 'FAILED', 'EXPIRED', 'REFUNDED'] as const;
const STATUS_CLASS: Record<string, string> = {
  PAID: 'bg-success-tint text-success-ink border-success/30',
  PENDING: 'bg-surface-raised text-ink border-warning',
  FAILED: 'bg-surface-raised text-danger border-danger/40',
  EXPIRED: 'bg-line-soft text-ink-muted border-line',
};
const PAGE_SIZE = 10;

/**
 * Đối soát thanh toán (tìm-kiếm-trước, 20/11/2026): mặc định không liệt kê giao dịch nào; admin nhập mã đơn, mã cổng, email/tên/ID người mua hoặc tên khóa học
 * (và/hoặc chọn trạng thái) rồi bấm Tìm — kết quả phân trang phía máy chủ. Bấm một dòng để xem chi tiết và thao tác.
 */
export default function AdminPaymentsPage() {
  const t = useTranslations('admin.payments');
  const locale = useLocale();
  const money = (n: number) => formatMoney(n, locale);
  const [input, setInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [criteria, setCriteria] = useState<{ q: string; status: string } | null>(null);
  const [page, setPage] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [receiptBusy, setReceiptBusy] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['admin', 'payments', criteria, page],
    queryFn: () => paymentsApi.searchAdmin(criteria?.q ?? '', criteria?.status ?? '', page, PAGE_SIZE),
    enabled: !!criteria && !!getAccessToken(),
  });
  const payments = (data?.items ?? []) as unknown as AdminPayment[];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const search = () => {
    if (!input.trim() && !statusInput) {
      toast.error('Hãy nhập mã đơn, email, tên người mua hoặc khóa học (hoặc chọn trạng thái) để tra cứu.');
      return;
    }
    setPage(0);
    setCriteria({ q: input, status: statusInput });
  };

  // Hộp chi tiết: Escape để đóng, tiêu điểm vào nút Đóng, trả tiêu điểm về nút đã mở.
  useEffect(() => {
    if (!selectedPayment) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPayment(null);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [selectedPayment]);

  const statusLabel = (status: string) => (STATUSES.includes(status as (typeof STATUSES)[number]) ? t(`status.${status}`) : status);
  const dateTime = (iso: string) => new Date(iso).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });

  /** Tìm biên lai của đơn rồi tải PDF (biên lai gắn theo mã đơn/mã nhóm đơn). */
  const downloadReceipt = async (p: AdminPayment) => {
    setReceiptBusy(true);
    try {
      const res = await adminInvoicesApi.list({ q: p.txnRef, type: 'RECEIPT', size: 1 });
      const inv = res.items[0];
      if (!inv) {
        toast.error('Giao dịch này chưa có biên lai. Biên lai được tạo sau khi giao dịch hoàn tất, thường trong vài phút.');
        return;
      }
      saveBlob(await adminInvoicesApi.pdf(inv.id), `${inv.number}.pdf`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không tải được biên lai. Vui lòng thử lại.');
    } finally {
      setReceiptBusy(false);
    }
  };

  const field = 'w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent';
  const labelCls = 'text-xs font-semibold text-ink-muted';

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <SearchPanel
        label="Tìm giao dịch"
        placeholder="Mã đơn, mã cổng thanh toán, email / tên / ID người mua, khóa học..."
        value={input}
        onChange={setInput}
        onSubmit={search}
        busy={isFetching}
        filters={
          <label className="flex w-full flex-col gap-1.5 sm:w-48">
            <span className={labelCls}>{t('filters.status')}</span>
            <select className={field} value={statusInput} onChange={(e) => setStatusInput(e.target.value)}>
              <option value="">{t('filters.all')}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </label>
        }
      />

      {!criteria ? (
        <SearchPrompt title="Nhập thông tin để tra cứu giao dịch">
          Hệ thống có rất nhiều giao dịch nên không hiển thị sẵn. Hãy nhập mã đơn, mã cổng thanh toán, email, tên hoặc ID người mua, hoặc tên khóa học;
          bấm vào một kết quả để xem chi tiết, tải biên lai và xử lý khiếu nại.
        </SearchPrompt>
      ) : isFetching && !data ? (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-raised p-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-6 text-center text-danger">{t('loadError')}</div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface-raised p-8 text-center text-ink-muted">{t('noMatch')}</div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-xl border border-line bg-surface-raised shadow-sm">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-line bg-surface text-xs text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('cols.ref')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('cols.user')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('cols.amount')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('cols.fee')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('cols.net')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('cols.source')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('cols.status')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('cols.time')}</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">{t('cols.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {payments.map((p) => (
                  <tr key={p.txnRef} className="transition-colors hover:bg-surface">
                    <td className="px-4 py-3 font-mono font-medium text-ink">{p.txnRef.substring(0, 8)}</td>
                    <td className="max-w-[190px] truncate px-4 py-3 font-medium text-ink" title={p.userEmail}>
                      {p.userEmail}
                      <div className="truncate text-xs font-normal text-ink-muted" title={p.courseTitle}>{p.courseTitle}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">{money(p.amount ?? 0)}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{p.platformFee ? money(p.platformFee) : '-'}</td>
                    <td className="px-4 py-3 font-semibold text-success-ink">{p.instructorEarning ? money(p.instructorEarning) : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${p.revenueSource === 'INSTRUCTOR_REFERRAL' ? 'bg-tint text-accent-dark' : 'bg-line-soft text-ink-muted'}`}>
                        {p.revenueSource === 'INSTRUCTOR_REFERRAL' ? t('source.referral') : t('source.organic')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[p.status] ?? 'border-line bg-line-soft text-ink'}`}>
                        {statusLabel(p.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{p.paidAt ? dateTime(p.paidAt) : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment(p)}
                        aria-label={`${t('details')}: ${p.txnRef.substring(0, 8)}`}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-accent-dark hover:bg-tint"
                      >
                        {t('details')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={totalPages} total={data?.total ?? 0} onPage={setPage} />
        </div>
      )}

      {selectedPayment && (
        <Modal open onClose={() => setSelectedPayment(null)} bare ariaLabel={String(t('detail.title'))} zClass="z-[400]" closeOnBackdrop={false} className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-surface-raised shadow-card-hover">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 id="payment-detail-title" className="m-0 font-display text-xl font-bold text-ink">{t('detail.title')}</h2>
              <button type="button" onClick={() => setSelectedPayment(null)} aria-label={t('detail.close')} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-tint hover:text-ink">
                <X size={18} aria-hidden />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4">
                <Detail wide label={t('detail.course')}>{selectedPayment.courseTitle}</Detail>
                <Detail wide label={t('detail.account')}>{selectedPayment.userEmail}</Detail>
                <Detail label={t('detail.billingName')}>{selectedPayment.billingName || t('detail.none')}</Detail>
                <Detail label={t('detail.phone')}>{selectedPayment.billingPhone || t('detail.none')}</Detail>
                <Detail wide label={t('detail.source')}>
                  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${selectedPayment.revenueSource === 'INSTRUCTOR_REFERRAL' ? 'bg-tint text-accent-dark' : 'bg-line-soft text-ink-muted'}`}>
                    {selectedPayment.revenueSource === 'INSTRUCTOR_REFERRAL' ? t('detail.sourceReferral') : t('detail.sourceOrganic')}
                  </span>
                </Detail>
                <Detail label={t('detail.fee', { percent: platformPercent(selectedPayment) })}>
                  <span className="font-semibold">{selectedPayment.platformFee ? money(selectedPayment.platformFee) : '-'}</span>
                </Detail>
                <Detail label={t('detail.earning', { percent: Math.round((100 - platformPercent(selectedPayment)) * 100) / 100 })}>
                  <span className="font-semibold text-success-ink">{selectedPayment.instructorEarning ? money(selectedPayment.instructorEarning) : '-'}</span>
                </Detail>
                {selectedPayment.couponCode && (
                  <div className="col-span-2 rounded-lg border border-accent/20 bg-tint p-3">
                    <dt className="mb-1 text-sm font-medium text-ink-muted">{t('detail.coupon')}</dt>
                    <dd className="m-0 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono font-bold text-accent-dark">{selectedPayment.couponCode}</span>
                      <span className="text-sm text-ink-muted">
                        {t('detail.couponMath', { original: money(selectedPayment.originalAmount ?? 0), discount: money(selectedPayment.discountAmount) })}
                      </span>
                    </dd>
                  </div>
                )}
                <Detail label={t('detail.method')}>{selectedPayment.paymentMethod}</Detail>
                <Detail label={t('detail.status')}>
                  <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[selectedPayment.status] ?? 'border-line bg-line-soft text-ink'}`}>
                    {statusLabel(selectedPayment.status)}
                  </span>
                </Detail>
                <Detail label={t('detail.failReason')}>{selectedPayment.status === 'FAILED' ? t('detail.failText') : t('detail.none')}</Detail>
                <Detail label={t('detail.ref')}>
                  <span className="inline-block rounded bg-surface px-2 py-1 font-mono text-sm">{selectedPayment.txnRef}</span>
                </Detail>
                <Detail label={t('detail.gateway')}>
                  <span className="font-mono text-sm">{selectedPayment.gatewayTxnNo || t('detail.notYet')}</span>
                </Detail>
              </dl>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-6 py-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={receiptBusy}
                  onClick={() => downloadReceipt(selectedPayment)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-sm font-semibold text-ink hover:bg-tint disabled:opacity-50"
                >
                  <FileText size={14} aria-hidden />
                  {receiptBusy ? 'Đang tải...' : 'Tải biên lai'}
                </button>
                <Link
                  href={`/admin/transactions/disputes?ref=${selectedPayment.txnRef}`}
                  className="rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-sm font-semibold text-ink hover:bg-tint"
                >
                  {t('detail.dispute')}
                </Link>
              </div>
              <button ref={closeRef} type="button" onClick={() => setSelectedPayment(null)} className="rounded-lg bg-accent px-5 py-2 font-semibold text-white hover:bg-accent-dark">
                {t('detail.close')}
              </button>
            </div>
          </Modal>
      )}
    </>
  );
}

function Detail({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <dt className="mb-1 text-sm font-medium text-ink-muted">{label}</dt>
      <dd className="m-0 font-medium text-ink">{children}</dd>
    </div>
  );
}
