'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { TableErrorRow } from '@/components/admin/ui/TableErrorRow';
import { ListSearch } from '@/components/ui/ListSearch';
import { Pager } from '@/components/ui/SearchPanel';
import { useAiJobs, useRetryAiJob } from '@/hooks/useAiJobs';
import { useDebounce } from '@/hooks/useDebounce';
import { ApiError } from '@/lib/api/client';
import { dateTime } from '@/lib/finance';
import type { AiJobSummary, JobStatus } from '@/types/domain';

/** Bộ lọc xem: "Cần xử lý" = job lỗi mà bài học + ngôn ngữ đó CHƯA có bản lồng tiếng thành công (job lỗi cũ đã được bản sau thay thế không hiện). */
type View = 'ATTENTION' | 'ALL' | JobStatus;
const VIEWS: View[] = ['ATTENTION', 'PROCESSING', 'PENDING', 'COMPLETED', 'FAILED', 'SKIPPED', 'ALL'];

/**
 * Giám sát job lồng tiếng (UC45, chỉnh 21/11/2026): mặc định chỉ hiện job CẦN XỬ LÝ; mỗi dòng nêu rõ khóa học, bài học, người yêu cầu và thời gian. Job lỗi cũ mà bài học + ngôn ngữ
 * đó đã có bản thành công được ghi "Đã có bản thành công" và KHÔNG có nút Thử lại (thử lại sẽ tốn chi phí AI vô ích). Nút Thử lại luôn hỏi xác nhận kèm cảnh báo chi phí.
 */
export function AiJobQueueManager() {
  const t = useTranslations('admin.jobs');
  const [view, setView] = useState<View>('ATTENTION');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [confirming, setConfirming] = useState<AiJobSummary | null>(null);

  const { data, isLoading, isError, refetch } = useAiJobs({
    view: view === 'ATTENTION' ? 'ATTENTION' : undefined,
    status: view === 'ATTENTION' || view === 'ALL' ? undefined : view,
    search: debouncedSearch || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
  });
  const retryJob = useRetryAiJob();
  const input = 'rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent';
  const reset = (fn: () => void) => {
    fn();
    setPage(0);
  };

  const doRetry = () => {
    if (!confirming) return;
    retryJob.mutate(confirming.id, {
      onSuccess: () => toast.success(t('queued')),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : t('retryFailed')),
    });
    setConfirming(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">{t('view.label')}</span>
          <select value={view} onChange={(e) => reset(() => setView(e.target.value as View))} className={`${input} w-72`}>
            {VIEWS.map((v) => (
              <option key={v} value={v}>{t(`view.${v}`)}</option>
            ))}
          </select>
        </label>
        <ListSearch label={t('find.label')} value={search} onChange={(v) => reset(() => setSearch(v))} placeholder={t('find.ph')} className="sm:w-80" />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">{t('from')}</span>
          <input type="date" value={from} max={to || undefined} onChange={(e) => reset(() => setFrom(e.target.value))} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">{t('to')}</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => reset(() => setTo(e.target.value))} className={input} />
        </label>
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-xl border border-line bg-surface-raised shadow-sm">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-surface text-xs font-bold text-ink-muted uppercase">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">{t('head.course')}</th>
              <th className="whitespace-nowrap px-4 py-3">{t('head.language')}</th>
              <th className="whitespace-nowrap px-4 py-3">{t('head.requester')}</th>
              <th className="whitespace-nowrap px-4 py-3">{t('head.status')}</th>
              <th className="whitespace-nowrap px-4 py-3">{t('head.progress')}</th>
              <th className="whitespace-nowrap px-4 py-3">{t('head.time')}</th>
              <th className="whitespace-nowrap px-4 py-3">{t('head.error')}</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">{t('head.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {isLoading && !data && (
              <tr><td colSpan={8} className="px-6 py-6 text-center text-ink-muted">{t('loading')}</td></tr>
            )}
            {isError && !data && <TableErrorRow colSpan={8} onRetry={() => void refetch()} />}
            {data && data.content.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-ink-muted">
                  {view === 'ATTENTION' ? t('emptyAttention') : t('emptyFilter')}
                </td>
              </tr>
            )}
            {data?.content.map((job) => (
              <tr key={job.id} className="align-top hover:bg-surface">
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink">{job.courseTitle}</div>
                  <div className="text-xs text-ink-muted">{t('jobRef', { lesson: job.lessonTitle, id: job.id })}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{job.targetLanguage}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {job.requestedByName ?? '—'}
                  {job.requestedByEmail && <div className="text-xs">{job.requestedByEmail}</div>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      job.status === 'FAILED'
                        ? job.superseded
                          ? 'bg-line-soft text-ink-muted'
                          : 'border border-danger/40 bg-surface-raised text-danger'
                        : job.status === 'COMPLETED'
                          ? 'bg-success-tint text-success-ink'
                          : job.status === 'SKIPPED' || job.status === 'CANCELLED'
                            ? 'bg-line-soft text-ink-muted'
                            : 'bg-tint text-accent-dark'
                    }`}
                  >
                    {t(`state.${job.status}`)}
                  </span>
                  {job.superseded && <div className="mt-1 text-xs text-success-ink">{t('superseded')}</div>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{job.doneChunks}/{job.totalChunks} ({job.progressPercent}%)<div className="text-xs">{t('retries', { count: job.retryCount })}</div></td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-muted">
                  {t('created', { at: dateTime(job.createdAt) })}
                  {job.finishedAt && <div>{t('finished', { at: dateTime(job.finishedAt) })}</div>}
                </td>
                <td className="max-w-xs px-4 py-3 text-xs text-ink-muted"><span className="line-clamp-2" title={job.errorMessage ?? ''}>{job.errorMessage ?? '—'}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {job.retryable && (
                    <button
                      type="button"
                      onClick={() => setConfirming(job)}
                      aria-label={t('retryAria', { lesson: job.lessonTitle })}
                      disabled={retryJob.isPending}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-accent-dark hover:bg-tint disabled:opacity-50"
                    >
                      {t('retry')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && <Pager page={page} totalPages={Math.max(1, data.totalPages)} total={data.totalElements} onPage={setPage} />}

      <ConfirmDialog
        open={confirming !== null}
        tone="primary"
        title={t('confirm.title')}
        body={
          confirming
            ? t('confirm.body', { lesson: confirming.lessonTitle, language: confirming.targetLanguage })
            : ''
        }
        confirmLabel={t('retry')}
        cancelLabel={t('confirm.cancel')}
        onConfirm={doRetry}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
