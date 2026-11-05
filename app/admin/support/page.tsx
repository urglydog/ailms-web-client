'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiError } from '@/lib/api/client';
import { supportApi } from '@/lib/api/support';
import type { SupportStatus, SupportTicketAdminRes } from '@/types/domain';

const STATUSES: SupportStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
const STATUS_CLASS: Record<SupportStatus, string> = {
  OPEN: 'bg-white text-ink border-warning',
  IN_PROGRESS: 'bg-tint text-accent-dark border-accent/30',
  RESOLVED: 'bg-success-tint text-success-ink border-success/30',
};

/** Hộp thư yêu cầu hỗ trợ của Admin — danh sách ticket, xem nội dung/ảnh, phản hồi (gửi email cho người gửi). */
export default function AdminSupportPage() {
  const t = useTranslations('admin.support');
  const queryClient = useQueryClient();

  const [tickets, setTickets] = useState<SupportTicketAdminRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SupportStatus | 'ALL'>('ALL');
  const [selected, setSelected] = useState<SupportTicketAdminRes | null>(null);
  const [status, setStatus] = useState<SupportStatus>('OPEN');
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    supportApi
      .listAdmin(statusFilter === 'ALL' ? undefined : statusFilter)
      .then(setTickets)
      .catch(() => toast.error(t('loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ phụ thuộc statusFilter
  }, [statusFilter]);

  const dateTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

  const open = (ticket: SupportTicketAdminRes) => {
    setSelected(ticket);
    setStatus(ticket.status);
    setReply('');
  };

  const handleSave = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await supportApi.update(selected.id, { status, reply: reply.trim() || undefined });
      toast.success(t('detail.saved'));
      setSelected(null);
      fetchTickets();
      queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'open-count'] });
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
            onChange={(e) => setStatusFilter(e.target.value as SupportStatus | 'ALL')}
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
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-8 text-center text-ink-muted">{t('empty')}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('cols.code')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.sender')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.subject')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.category')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.status')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.time')}</th>
                <th className="px-4 py-3 text-right font-semibold">{t('cols.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-mono text-ink">{ticket.code}</td>
                  <td className="px-4 py-3 text-ink">{ticket.email}</td>
                  <td className="max-w-[240px] truncate px-4 py-3 text-ink-muted" title={ticket.subject}>{ticket.subject}</td>
                  <td className="px-4 py-3 text-ink-muted">{t(`category.${ticket.category}`)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[ticket.status]}`}>{t(`status.${ticket.status}`)}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{dateTime(ticket.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => open(ticket)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-accent-dark hover:bg-tint">
                      {t('view')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-ink/40 p-4">
          <div role="dialog" aria-modal="true" aria-label={selected.code} className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card-hover">
            <div className="flex items-start justify-between gap-3 border-b border-line p-5">
              <div className="min-w-0">
                <p className="m-0 font-mono text-xs text-ink-muted">{selected.code}</p>
                <h2 className="m-0 break-words font-display text-base font-bold text-ink">{selected.subject}</h2>
                <p className="m-0 mt-0.5 text-xs text-ink-muted">{selected.email} · {dateTime(selected.createdAt)}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink-muted hover:bg-tint">
                {t('detail.close')}
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto p-5 text-sm">
              <div>
                <p className="m-0 mb-1 text-xs font-semibold text-ink-muted">{t('detail.message')}</p>
                <p className="m-0 whitespace-pre-wrap break-words text-ink">{selected.message}</p>
              </div>

              <div>
                <p className="m-0 mb-1.5 text-xs font-semibold text-ink-muted">{t('detail.attachments')}</p>
                {selected.attachments.length === 0 ? (
                  <p className="m-0 text-xs text-ink-muted">{t('detail.noAttachments')}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selected.attachments.map((a) => (
                      <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer" className="block h-20 w-20 overflow-hidden rounded-lg border border-line">
                        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh minh chứng từ kho lưu trữ ngoài, cùng cách trang khiếu nại giao dịch */}
                        <img src={a.fileUrl} alt="" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {selected.userId !== null ? (
                <Link href={`/admin/users/${selected.userId}`} className="w-fit text-xs font-bold text-accent-dark hover:underline">
                  {t('detail.openUser')}
                </Link>
              ) : (
                <p className="m-0 text-xs text-ink-muted">{t('detail.noUser')}</p>
              )}

              {selected.adminReply && (
                <div className="rounded-lg bg-surface p-3">
                  <p className="m-0 mb-1 text-xs font-semibold text-ink-muted">{t('detail.previousReply')}</p>
                  <p className="m-0 whitespace-pre-wrap break-words text-ink">{selected.adminReply}</p>
                </div>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-muted">{t('detail.status')}</span>
                <select value={status} onChange={(e) => setStatus(e.target.value as SupportStatus)} className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`status.${s}`)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-muted">{t('detail.reply')}</span>
                <textarea
                  rows={4}
                  maxLength={3000}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={t('detail.replyPh')}
                  className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent"
                />
              </label>
            </div>

            <div className="border-t border-line p-4">
              <button type="button" disabled={submitting} onClick={handleSave} className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
                {submitting ? t('detail.saving') : t('detail.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
