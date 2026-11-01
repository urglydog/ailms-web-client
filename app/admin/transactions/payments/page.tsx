'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { isSameDay } from 'date-fns';
import { ArrowDown, ArrowUp, ArrowUpDown, RefreshCw, X } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { paginate, type SortOrder } from '@/lib/admin/users';
import { paymentsApi } from '@/lib/api/payments';
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
}

type SortField = 'txnRef' | 'userEmail' | 'amount' | 'paymentMethod' | 'paidAt';

const STATUSES = ['PAID', 'PENDING', 'FAILED', 'EXPIRED'] as const;
const STATUS_CLASS: Record<string, string> = {
  PAID: 'bg-success-tint text-success-ink border-success/30',
  PENDING: 'bg-white text-ink border-warning',
  FAILED: 'bg-white text-danger border-danger/40',
  EXPIRED: 'bg-line-soft text-ink-muted border-line',
};
const PAGE_SIZE = 10;

/** Đối soát thanh toán: lọc theo email/ngày/trạng thái, bảng sắp xếp được, phân trang và hộp chi tiết giao dịch. */
export default function AdminPaymentsPage() {
  const t = useTranslations('admin.payments');
  const locale = useLocale();
  const money = (n: number) => formatMoney(n, locale);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [sortField, setSortField] = useState<SortField>('paidAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const fetchPayments = () => {
    setLoading(true);
    paymentsApi
      .listAllAdmin()
      .then((data) => setPayments(data as unknown as AdminPayment[]))
      .catch(() => toast.error(t('loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ tải một lần khi vào trang
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchEmail, searchDate]);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filtered = useMemo(() => {
    let result = [...payments];
    if (statusFilter !== 'ALL') result = result.filter((p) => p.status === statusFilter);
    if (searchEmail.trim()) {
      const q = searchEmail.toLowerCase();
      result = result.filter((p) => p.userEmail?.toLowerCase().includes(q));
    }
    if (searchDate) {
      const target = new Date(searchDate);
      result = result.filter((p) => p.paidAt && isSameDay(new Date(p.paidAt), target));
    }
    const dir = sortOrder === 'asc' ? 1 : -1;
    return result.sort((a, b) => {
      const value = (p: AdminPayment): string | number =>
        sortField === 'paidAt' ? (p.paidAt ? new Date(p.paidAt).getTime() : 0) : (p[sortField] ?? 0);
      const va = value(a);
      const vb = value(b);
      return va < vb ? -dir : va > vb ? dir : 0;
    });
  }, [payments, statusFilter, searchEmail, searchDate, sortField, sortOrder]);

  const paged = paginate(filtered, currentPage, PAGE_SIZE);
  const dateTime = (iso: string) => new Date(iso).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => {
    const Icon = sortField !== field ? ArrowUpDown : sortOrder === 'asc' ? ArrowUp : ArrowDown;
    return (
      <th scope="col" aria-sort={sortField !== field ? 'none' : sortOrder === 'asc' ? 'ascending' : 'descending'} className="px-4 py-3 font-semibold">
        <button type="button" onClick={() => handleSort(field)} className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-ink-muted hover:text-ink">
          {label}
          <Icon size={13} aria-hidden className={sortField === field ? 'text-accent' : 'opacity-50'} />
        </button>
      </th>
    );
  };

  const field = 'w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent';
  const labelCls = 'text-xs font-semibold text-ink-muted';

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <button type="button" onClick={fetchPayments} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-tint">
            <RefreshCw size={14} aria-hidden />
            {t('refresh')}
          </button>
        }
      />

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-line bg-white p-4">
        <label className="flex w-full flex-col gap-1.5 sm:w-64">
          <span className={labelCls}>{t('filters.email')}</span>
          <input type="search" placeholder={t('filters.emailPh')} className={field} value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} />
        </label>
        <label className="flex w-full flex-col gap-1.5 sm:w-48">
          <span className={labelCls}>{t('filters.date')}</span>
          <input type="date" className={field} value={searchDate} onChange={(e) => setSearchDate(e.target.value)} />
        </label>
        <label className="flex w-full flex-col gap-1.5 sm:w-48">
          <span className={labelCls}>{t('filters.status')}</span>
          <select className={field} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">{t('filters.all')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-8 text-center text-ink-muted">{t('empty')}</div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-line bg-surface text-xs text-ink-muted">
                <tr>
                  <SortHeader field="txnRef" label={t('cols.ref')} />
                  <SortHeader field="userEmail" label={t('cols.user')} />
                  <SortHeader field="amount" label={t('cols.amount')} />
                  <th scope="col" className="px-4 py-3 font-semibold">{t('cols.fee')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('cols.net')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('cols.source')}</th>
                  <SortHeader field="paymentMethod" label={t('cols.method')} />
                  <th scope="col" className="px-4 py-3 font-semibold">{t('cols.status')}</th>
                  <SortHeader field="paidAt" label={t('cols.time')} />
                  <th scope="col" className="px-4 py-3 text-right font-semibold">{t('cols.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {paged.items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-ink-muted">{t('noMatch')}</td>
                  </tr>
                ) : (
                  paged.items.map((p) => (
                    <tr key={p.txnRef} className="transition-colors hover:bg-surface">
                      <td className="px-4 py-3 font-mono font-medium text-ink">{p.txnRef.substring(0, 8)}</td>
                      <td className="max-w-[170px] truncate px-4 py-3 font-medium text-ink" title={p.userEmail}>{p.userEmail}</td>
                      <td className="px-4 py-3 font-semibold text-ink">{money(p.amount ?? 0)}</td>
                      <td className="px-4 py-3 font-semibold text-ink">{p.platformFee ? money(p.platformFee) : '-'}</td>
                      <td className="px-4 py-3 font-semibold text-success-ink">{p.instructorEarning ? money(p.instructorEarning) : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${p.revenueSource === 'INSTRUCTOR_REFERRAL' ? 'bg-tint text-accent-dark' : 'bg-line-soft text-ink-muted'}`}>
                          {p.revenueSource === 'INSTRUCTOR_REFERRAL' ? t('source.referral') : t('source.organic')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-line-soft px-2.5 py-1 text-xs font-semibold text-ink">{p.paymentMethod}</span>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {paged.totalPages > 1 && (
            <nav aria-label={t('pager.aria')} className="flex flex-wrap items-center justify-between gap-3 px-1">
              <span className="text-sm text-ink-muted">{t('pager.showing', { shown: paged.items.length, total: filtered.length })}</span>
              <div className="flex items-center gap-2">
                <button type="button" disabled={paged.page === 1} onClick={() => setCurrentPage(paged.page - 1)} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink hover:bg-tint disabled:opacity-50">
                  {t('pager.prev')}
                </button>
                <span className="px-2 text-sm font-semibold text-ink">{t('pager.page', { page: paged.page, total: paged.totalPages })}</span>
                <button type="button" disabled={paged.page === paged.totalPages} onClick={() => setCurrentPage(paged.page + 1)} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink hover:bg-tint disabled:opacity-50">
                  {t('pager.next')}
                </button>
              </div>
            </nav>
          )}
        </div>
      )}

      {selectedPayment && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-ink/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="payment-detail-title" className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card-hover">
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
                <Detail label={t('detail.fee', { percent: selectedPayment.revenueSource === 'INSTRUCTOR_REFERRAL' ? 3 : 63 })}>
                  <span className="font-semibold">{selectedPayment.platformFee ? money(selectedPayment.platformFee) : '-'}</span>
                </Detail>
                <Detail label={t('detail.earning', { percent: selectedPayment.revenueSource === 'INSTRUCTOR_REFERRAL' ? 97 : 37 })}>
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
              <div className="flex gap-2">
                <Link
                  href={`/admin/transactions/disputes?ref=${selectedPayment.txnRef}`}
                  className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink hover:bg-tint"
                >
                  {t('detail.dispute')}
                </Link>
              </div>
              <button ref={closeRef} type="button" onClick={() => setSelectedPayment(null)} className="rounded-lg bg-accent px-5 py-2 font-semibold text-white hover:bg-accent-dark">
                {t('detail.close')}
              </button>
            </div>
          </div>
        </div>
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
