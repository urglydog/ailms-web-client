'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiError } from '@/lib/api/client';
import { disputesApi } from '@/lib/api/disputes';
import type { DisputeAdminRes, DisputeStatus } from '@/types/domain';

const STATUSES: DisputeStatus[] = ['OPEN', 'RESOLVED_REFUNDED', 'RESOLVED_REJECTED'];
const STATUS_CLASS: Record<DisputeStatus, string> = {
  OPEN: 'bg-white text-ink border-warning',
  RESOLVED_REFUNDED: 'bg-success-tint text-success-ink border-success/30',
  RESOLVED_REJECTED: 'bg-line-soft text-ink-muted border-line',
};

/** `useSearchParams()` bắt buộc nằm trong Suspense khi build static export (Next.js prerender) —
 * dev server không báo lỗi này, chỉ `next build`/Vercel production build mới bắt được. */
export default function AdminDisputesPage() {
  return (
    <Suspense fallback={null}>
      <AdminDisputesContent />
    </Suspense>
  );
}

function AdminDisputesContent() {
  const t = useTranslations('admin.disputes');
  const searchParams = useSearchParams();
  const highlightRef = searchParams.get('ref');

  const [disputes, setDisputes] = useState<DisputeAdminRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'ALL'>('ALL');
  const [selected, setSelected] = useState<DisputeAdminRes | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = () => {
    setLoading(true);
    disputesApi
      .listAllAdmin(statusFilter === 'ALL' ? undefined : statusFilter)
      .then(setDisputes)
      .catch(() => toast.error(t('loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDisputes();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ phụ thuộc statusFilter
  }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!highlightRef) return disputes;
    return [...disputes].sort((a, b) => (a.paymentTxnRef === highlightRef ? -1 : b.paymentTxnRef === highlightRef ? 1 : 0));
  }, [disputes, highlightRef]);

  const dateTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

  const openResolve = (d: DisputeAdminRes) => {
    setSelected(d);
    setNote('');
  };

  const handleResolve = async (status: 'RESOLVED_REFUNDED' | 'RESOLVED_REJECTED') => {
    if (!selected || !note.trim()) return;
    setSubmitting(true);
    try {
      await disputesApi.resolve(selected.id, { status, note: note.trim() });
      toast.success(status === 'RESOLVED_REFUNDED' ? 'Đã đánh dấu hoàn tiền.' : 'Đã từ chối khiếu nại.');
      setSelected(null);
      fetchDisputes();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('detail.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-line bg-white p-4">
        <label className="flex w-full flex-col gap-1.5 sm:w-56">
          <span className="text-xs font-semibold text-ink-muted">{t('filters.status')}</span>
          <select
            className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DisputeStatus | 'ALL')}
          >
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
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-8 text-center text-ink-muted">{t('empty')}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('cols.ref')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.user')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.reason')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.amount')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.status')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.time')}</th>
                <th className="px-4 py-3 text-right font-semibold">{t('cols.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {filtered.map((d) => (
                <tr key={d.id} className={`hover:bg-surface ${d.paymentTxnRef === highlightRef ? 'bg-tint/40' : ''}`}>
                  <td className="px-4 py-3 font-mono text-ink">{d.paymentTxnRef.substring(0, 8)}</td>
                  <td className="px-4 py-3 text-ink">{d.filedByEmail}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-ink-muted" title={d.reason}>{d.reason}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{d.amount.toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[d.status]}`}>{t(`status.${d.status}`)}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{dateTime(d.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {d.status === 'OPEN' ? (
                      <button type="button" onClick={() => openResolve(d)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-accent-dark hover:bg-tint">
                        {t('process')}
                      </button>
                    ) : (
                      <button type="button" onClick={() => openResolve(d)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink-muted hover:bg-tint">
                        {t('cols.actions')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-ink/40 p-4">
          <div role="dialog" aria-modal="true" className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card-hover">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="m-0 font-display text-xl font-bold text-ink">{t('detail.title')}</h2>
              <button type="button" onClick={() => setSelected(null)} aria-label={t('detail.cancel')} className="text-ink-muted hover:text-ink">
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-2">
                  <dt className="mb-1 text-sm font-medium text-ink-muted">{t('detail.course')}</dt>
                  <dd className="m-0 font-medium text-ink">{selected.courseTitle}</dd>
                </div>
                <div>
                  <dt className="mb-1 text-sm font-medium text-ink-muted">{t('detail.amount')}</dt>
                  <dd className="m-0 font-semibold text-ink">{selected.amount.toLocaleString('vi-VN')}đ</dd>
                </div>
                <div>
                  <dt className="mb-1 text-sm font-medium text-ink-muted">{t('detail.bankAccount')}</dt>
                  <dd className="m-0 font-mono text-sm text-ink">{selected.refundBankAccount || t('detail.none')}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="mb-1 text-sm font-medium text-ink-muted">{t('detail.reason')}</dt>
                  <dd className="m-0 text-ink">{selected.reason}</dd>
                </div>
                {selected.description && (
                  <div className="col-span-2">
                    <dt className="mb-1 text-sm font-medium text-ink-muted">{t('detail.description')}</dt>
                    <dd className="m-0 text-ink">{selected.description}</dd>
                  </div>
                )}
              </dl>

              {selected.status === 'OPEN' ? (
                <div className="mt-5 flex flex-col gap-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-ink">{t('detail.note')}</span>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder={t('detail.notePh')}
                      className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent"
                    />
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={submitting || !note.trim()}
                      onClick={() => handleResolve('RESOLVED_REFUNDED')}
                      className="rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {t('detail.markRefunded')}
                    </button>
                    <button
                      type="button"
                      disabled={submitting || !note.trim()}
                      onClick={() => handleResolve('RESOLVED_REJECTED')}
                      className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-danger ring-1 ring-inset ring-danger/40 hover:bg-danger/5 disabled:opacity-50"
                    >
                      {t('detail.reject')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-lg border border-line bg-surface p-4">
                  <p className="m-0 text-sm text-ink">{selected.adminNote}</p>
                  {selected.resolvedByEmail && (
                    <p className="m-0 mt-2 text-xs text-ink-muted">{t('detail.resolvedBy', { email: selected.resolvedByEmail })}</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end border-t border-line bg-surface px-6 py-4">
              <button type="button" onClick={() => setSelected(null)} className="rounded-lg bg-accent px-5 py-2 font-semibold text-white hover:bg-accent-dark">
                {t('detail.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
