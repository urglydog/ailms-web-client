'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAiJobs, useRetryAiJob } from '@/hooks/useAiJobs';
import { ApiError } from '@/lib/api/client';
import type { JobStatus } from '@/types/domain';

/**
 * UC45 — Admin giám sát hàng đợi lồng tiếng AI: danh sách job lọc theo trạng thái, thử lại
 * job `FAILED` (BR-CHUNK-04: tối đa 3 lần, `SKIPPED` không bao giờ cho retry — BR-DUB-10).
 */
const STATUS_OPTIONS: Array<JobStatus | 'ALL'> = ['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED'];

export function AiJobQueueManager() {
  const t = useTranslations('admin.jobs');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const { data, isLoading } = useAiJobs(statusFilter === 'ALL' ? undefined : statusFilter, search || undefined, page);
  const retryJob = useRetryAiJob();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Debounce 400ms trước khi gọi API, tránh gửi request mỗi phím gõ.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const handleRetry = (id: number) => {
    setErrorMessage(null);
    retryJob.mutate(id, {
      onError: (err) =>
        setErrorMessage(err instanceof ApiError ? err.message : t('retryError')),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <select
          aria-label={t('filterLabel')}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as JobStatus | 'ALL');
            setPage(0);
          }}
          className="w-48 rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {t(`status.${opt}`)}
            </option>
          ))}
        </select>
        <input
          type="search"
          aria-label={t('searchLabel')}
          placeholder={t('searchPh')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-64 rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      {errorMessage && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-white p-4 text-[13px] text-danger">{errorMessage}</div>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-surface text-xs font-bold text-ink-muted uppercase">
            <tr>
              <th className="px-6 py-4">{t('cols.lesson')}</th>
              <th className="px-6 py-4">{t('cols.language')}</th>
              <th className="px-6 py-4">{t('cols.status')}</th>
              <th className="px-6 py-4">{t('cols.progress')}</th>
              <th className="px-6 py-4">{t('cols.retry')}</th>
              <th className="px-6 py-4">{t('cols.error')}</th>
              <th className="px-6 py-4 text-right">{t('cols.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-ink-muted">
                  {t('loading')}
                </td>
              </tr>
            )}
            {!isLoading && data?.content.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-ink-muted">
                  {t('empty')}
                </td>
              </tr>
            )}
            {data?.content.map((job) => (
              <tr key={job.id} className="hover:bg-surface">
                <td className="px-6 py-3 font-semibold text-ink">
                  {job.lessonTitle}
                  <span className="ml-1 font-normal text-ink-muted">#{job.lessonId}</span>
                </td>
                <td className="px-6 py-3 text-ink-muted">{job.targetLanguage}</td>
                <td className="px-6 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      job.status === 'FAILED'
                        ? 'bg-white border border-danger/40 text-danger'
                        : job.status === 'COMPLETED'
                          ? 'bg-success-tint text-success-ink'
                          : job.status === 'SKIPPED'
                            ? 'bg-line-soft text-ink-muted'
                            : 'bg-tint text-accent-dark'
                    }`}
                  >
                    {t(`status.${job.status}`)}
                  </span>
                </td>
                <td className="px-6 py-3 text-ink-muted">
                  {job.doneChunks}/{job.totalChunks} ({job.progressPercent}%)
                </td>
                <td className="px-6 py-3 text-ink-muted">{job.retryCount}/3</td>
                <td className="px-6 py-3 max-w-xs truncate text-ink-muted" title={job.errorMessage ?? ''}>
                  {job.errorMessage ?? '—'}
                </td>
                <td className="px-6 py-3 text-right">
                  {job.status === 'FAILED' && (
                    <button
                      onClick={() => handleRetry(job.id)}
                      aria-label={`${t('retry')}: ${job.lessonTitle}`}
                      disabled={retryJob.isPending}
                      className="text-xs font-bold text-accent-dark hover:text-ink disabled:opacity-50"
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

      {data && data.totalPages > 1 && (
        <nav aria-label={t('pager.aria')} className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink-muted">{t('pager.page', { page: data.number + 1, total: data.totalPages })}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={data.first}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink hover:bg-tint disabled:opacity-50"
            >
              {t('pager.prev')}
            </button>
            <button
              type="button"
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink hover:bg-tint disabled:opacity-50"
            >
              {t('pager.next')}
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
