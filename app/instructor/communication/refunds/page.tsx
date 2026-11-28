'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ListSearch } from '@/components/ui/ListSearch';
import { Pager } from '@/components/ui/SearchPanel';
import { useListControls } from '@/hooks/useListControls';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useInstructorDisputes, useRespondToDispute } from '@/hooks/useInstructorDisputes';
import { RefundDecisionPanel } from '@/components/instructor/refunds/RefundDecisionPanel';
import { ApiError } from '@/lib/api/client';
import type { DisputeStatus, InstructorDisputeRes } from '@/types/domain';

const STATUSES: DisputeStatus[] = ['OPEN', 'REOPENED', 'RESOLVED_REFUNDED', 'RESOLVED_REJECTED'];
const STATUS_CLASS: Record<DisputeStatus, string> = {
  OPEN: 'bg-surface-raised text-ink border-warning',
  REOPENED: 'bg-danger/10 text-danger border-danger/30',
  RESOLVED_REFUNDED: 'bg-success-tint text-success-ink border-success/30',
  RESOLVED_REJECTED: 'bg-line-soft text-ink-muted border-line',
};
const MAX_FILES = 5;
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,video/mp4,video/webm';

const money = (n: number | null | undefined) => `${(n ?? 0).toLocaleString('vi-VN')}đ`;
const dateTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

/** Giảng viên cần phản hồi: khiếu nại còn mở và chưa có quyết định (NO_RESPONSE vẫn cho phản hồi muộn). */
const needsResponse = (d: InstructorDisputeRes) =>
  (d.status === 'OPEN' || d.status === 'REOPENED') && (d.instructorDecision == null || d.instructorDecision === 'NO_RESPONSE');

/**
 * "Yêu cầu hoàn tiền" của giảng viên (11/11/2026, Epic hoàn tiền – chi trả): xem mọi khiếu nại/yêu cầu hoàn tiền thuộc khóa
 * của mình, phản hồi (đồng ý/phản đối + minh chứng) trước hạn. Admin vẫn là người quyết định cuối. Dữ liệu cá nhân của
 * học viên (email, SĐT, STK ngân hàng) không bao giờ được BE trả về ở đây.
 */
export default function InstructorRefundsPage() {
  const t = useTranslations('instructor.refunds');
  const { data, isLoading, isError } = useInstructorDisputes();
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'ALL'>('ALL');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filterByStatus = useMemo(() => (d: { status: DisputeStatus }) => statusFilter === 'ALL' || d.status === statusFilter, [statusFilter]);
  const list = useListControls(data, {
    pageSize: 8,
    filter: filterByStatus,
    match: (d, q) => d.courseTitle.toLowerCase().includes(q) || d.paymentTxnRef.toLowerCase().includes(q) || d.learnerName.toLowerCase().includes(q),
  });
  const filtered = list.pageItems;
  const selected = (data ?? []).find((d) => d.id === selectedId) ?? null;
  const pendingCount = (data ?? []).filter(needsResponse).length;

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-line bg-surface-raised p-4">
        <ListSearch label={t('searchLabel')} value={list.query} onChange={list.setQuery} placeholder={t('searchPlaceholder')} />
        <label className="flex w-full flex-col gap-1.5 sm:w-56">
          <span className="text-xs font-semibold text-ink-muted">{t('filters.status')}</span>
          <select
            className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as DisputeStatus | 'ALL');
              list.setPage(0);
            }}
          >
            <option value="ALL">{t('filters.all')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{t(`status.${s}`)}</option>
            ))}
          </select>
        </label>
        {pendingCount > 0 && (
          <span className="rounded-full border border-warning bg-surface-raised px-3 py-1 text-xs font-semibold text-ink">
            {t('pendingBadge', { count: pendingCount })}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-raised p-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-6 text-center text-danger">{t('loadError')}</div>
      ) : list.total === 0 ? (
        <div className="rounded-xl border border-line bg-surface-raised p-8 text-center text-ink-muted">{t('empty')}</div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {filtered.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setSelectedId(d.id)}
                className="flex w-full flex-col gap-2 rounded-xl border border-line bg-surface-raised p-4 text-left hover:bg-surface"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{d.courseTitle}</span>
                  <span className="flex items-center gap-2">
                    {needsResponse(d) && (
                      <span className="rounded-full bg-tint px-2.5 py-1 text-xs font-bold text-accent-dark">{t('needsResponse')}</span>
                    )}
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[d.status]}`}>{t(`status.${d.status}`)}</span>
                  </span>
                </div>
                <div className="text-sm text-ink-muted">
                  {d.learnerName} · {money(d.amount)} · {dateTime(d.createdAt)}
                </div>
                <div className="line-clamp-2 text-sm text-ink">{d.reason}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!isLoading && !isError && list.total > 0 && <Pager page={list.page} totalPages={list.totalPages} total={list.total} onPage={list.setPage} />}

      {selected && <RefundDetailModal dispute={selected} onClose={() => setSelectedId(null)} />}
    </>
  );
}

function RefundDetailModal({ dispute: d, onClose }: { dispute: InstructorDisputeRes; onClose: () => void }) {
  const t = useTranslations('instructor.refunds');
  const respond = useRespondToDispute();
  const [decision, setDecision] = useState<'AGREE_REFUND' | 'OBJECT'>('OBJECT');
  const [response, setResponse] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const canRespond = needsResponse(d);
  const hoursLeft = d.instructorDeadlineAt
    ? Math.max(0, Math.ceil((new Date(d.instructorDeadlineAt).getTime() - Date.now()) / 3_600_000))
    : null;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length > MAX_FILES) {
      toast.error(t('response.tooMany', { max: MAX_FILES }));
      return;
    }
    setFiles(picked);
  };

  const submit = () => {
    if (!response.trim()) return;
    respond.mutate(
      { id: d.id, req: { decision, response: response.trim() }, files },
      {
        onSuccess: () => {
          toast.success(t('response.sent'));
          onClose();
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : t('response.error')),
      },
    );
  };

  const attachmentLink = (a: { id: number; fileUrl: string; fileType: string }) =>
    a.fileType === 'mp4' || a.fileType === 'webm' ? (
      <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer" className="flex h-20 w-20 items-center justify-center rounded-lg border border-line bg-surface text-xs font-semibold text-accent-dark hover:bg-tint">
        {t('detail.viewVideo')}
      </a>
    ) : (
      <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer" className="block h-20 w-20 overflow-hidden rounded-lg border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh minh chứng từ B2, domain động */}
        <img src={a.fileUrl} alt="" className="h-full w-full object-cover" />
      </a>
    );

  return (
    <Modal open onClose={onClose} title={t('detail.title')} size="lg" closeOnBackdrop={false}>
      <div className="flex flex-col gap-5">
        <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div className="col-span-2">
            <dt className="text-ink-muted">{t('courseLabel')}</dt>
            <dd className="m-0 font-medium text-ink">{d.courseTitle}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t('learner')}</dt>
            <dd className="m-0 text-ink">{d.learnerName}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t('paidAt')}</dt>
            <dd className="m-0 text-ink">{d.paidAt ? dateTime(d.paidAt) : '—'}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t('amount')}</dt>
            <dd className="m-0 font-semibold text-ink">{money(d.amount)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t('yourEarning')}</dt>
            <dd className="m-0 font-semibold text-ink">{money(d.instructorEarning)}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          {d.category && (
            <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink">{t(`category.${d.category}`)}</span>
          )}
          {d.eligibility && (
            <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink">{t(`eligibility.${d.eligibility}`)}</span>
          )}
          {d.progressPctAtFiling != null && (
            <span className="text-xs text-ink-muted">{t('progress', { percent: d.progressPctAtFiling })}</span>
          )}
        </div>

        <div>
          <h3 className="m-0 mb-1 text-sm font-semibold text-ink">{t('detail.reason')}</h3>
          <p className="m-0 whitespace-pre-wrap text-sm text-ink">{d.reason}</p>
          {d.description && <p className="m-0 mt-2 whitespace-pre-wrap text-sm text-ink-muted">{d.description}</p>}
        </div>

        {d.studentAttachments.length > 0 && (
          <div>
            <h3 className="m-0 mb-1.5 text-sm font-semibold text-ink">{t('detail.attachments')}</h3>
            <div className="flex flex-wrap gap-2">{d.studentAttachments.map(attachmentLink)}</div>
          </div>
        )}

        {(d.status === 'RESOLVED_REFUNDED' || d.status === 'RESOLVED_REJECTED') && (
          <div className="rounded-lg border border-line bg-surface p-4 text-sm text-ink">
            {d.status === 'RESOLVED_REJECTED'
              ? t('result.rejected')
              : d.instructorCharge != null && d.instructorCharge > 0
                ? t('result.refunded', { charge: money(d.instructorCharge) })
                : t('result.refundedNoCharge')}
          </div>
        )}

        <RefundDecisionPanel d={d} />

        <div className="rounded-lg border border-line bg-surface p-4">
          <h3 className="m-0 mb-2 text-sm font-semibold text-ink">{t('response.title')}</h3>
          {d.instructorDecision && d.instructorDecision !== 'NO_RESPONSE' ? (
            <>
              <p className="m-0 text-sm font-semibold text-ink">
                {d.instructorDecision === 'AGREE_REFUND' ? t('response.agree') : t('response.object')}
              </p>
              <p className="m-0 mt-1 whitespace-pre-wrap text-sm text-ink">{d.instructorResponse}</p>
              {d.instructorAttachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">{d.instructorAttachments.map(attachmentLink)}</div>
              )}
              {d.instructorRespondedAt && (
                <p className="m-0 mt-2 text-xs text-ink-muted">{dateTime(d.instructorRespondedAt)}</p>
              )}
            </>
          ) : canRespond ? (
            <div className="flex flex-col gap-3">
              {d.instructorDeadlineAt && (
                <p className="m-0 text-xs text-ink-muted">
                  {t('deadline', { time: dateTime(d.instructorDeadlineAt) })}
                  {' · '}
                  {hoursLeft === 0 || d.instructorDecision === 'NO_RESPONSE' ? t('overdue') : t('hoursLeft', { count: hoursLeft ?? 0 })}
                </p>
              )}
              <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                <legend className="sr-only">{t('response.title')}</legend>
                {(['OBJECT', 'AGREE_REFUND'] as const).map((opt) => (
                  <label
                    key={opt}
                    className={`flex cursor-pointer gap-2.5 rounded-lg border p-3 text-sm ${decision === opt ? 'border-accent bg-tint' : 'border-line bg-surface-raised'}`}
                  >
                    <input type="radio" name="decision" value={opt} checked={decision === opt} onChange={() => setDecision(opt)} className="mt-0.5" />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-semibold text-ink">{opt === 'AGREE_REFUND' ? t('response.agree') : t('response.object')}</span>
                      <span className="text-xs text-ink-muted">{opt === 'AGREE_REFUND' ? t('response.agreeHint') : t('response.objectHint')}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-ink">{t('response.text')}</span>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                  maxLength={4000}
                  placeholder={t('response.textPh')}
                  className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-ink">{t('response.files', { max: MAX_FILES })}</span>
                <input
                  type="file"
                  multiple
                  accept={ACCEPTED_TYPES}
                  onChange={handleFiles}
                  className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent file:mr-3 file:rounded-md file:border-0 file:bg-tint file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-accent-dark"
                />
              </label>
              <p className="m-0 text-xs text-ink-muted">{t('note')}</p>
              <button
                type="button"
                disabled={respond.isPending || !response.trim()}
                onClick={submit}
                className="w-fit rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
              >
                {respond.isPending ? t('response.submitting') : t('response.submit')}
              </button>
            </div>
          ) : (
            <p className="m-0 text-sm text-ink-muted">{t('response.noResponse')}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
