'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAllReviews, useHideReview, useUnhideReview } from '@/hooks/useReviews';
import { useDebounce } from '@/hooks/useDebounce';
import { ApiError } from '@/lib/api/client';

/** UC44 — bám khung `CategoryManager.tsx`: bảng + lỗi cục bộ + confirm trước khi hành động. */
export function ReviewManager() {
  const t = useTranslations('admin.reviews');
  const locale = useLocale();
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const [mounted, setMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // States for filtering & pagination
  const [page, setPage] = useState(0);
  const [courseTitleInput, setCourseTitleInput] = useState('');
  const [instructorEmailInput, setInstructorEmailInput] = useState('');
  const [status, setStatus] = useState('ALL');

  // Debounced filters (400ms delay)
  const debouncedCourseTitle = useDebounce(courseTitleInput, 400);
  const debouncedInstructorEmail = useDebounce(instructorEmailInput, 400);

  // Reset page to 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedCourseTitle, debouncedInstructorEmail, status]);

  const { data, isLoading } = useAllReviews(
    page,
    20,
    debouncedCourseTitle,
    debouncedInstructorEmail,
    status
  );

  const hideReview = useHideReview();
  const unhideReview = useUnhideReview();

  useEffect(() => { setMounted(true); }, []);

  const reviews = data?.content ?? [];

  const handleHide = (id: number) => {
    setErrorMessage(null);
    hideReview.mutate(id, {
      onError: (err) => setErrorMessage(err instanceof ApiError ? err.message : t('hideError')),
    });
  };

  const handleUnhide = (id: number) => {
    setErrorMessage(null);
    unhideReview.mutate(id, {
      onError: (err) => setErrorMessage(err instanceof ApiError ? err.message : t('unhideError')),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {errorMessage && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-white p-4 text-[13px] text-danger">{errorMessage}</div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-surface p-4 rounded-xl border border-line">
        <input
          type="search"
          aria-label={t('coursePh')}
          placeholder={t('coursePh')}
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          value={courseTitleInput}
          onChange={(e) => setCourseTitleInput(e.target.value)}
        />
        <input
          type="search"
          aria-label={t('instructorPh')}
          placeholder={t('instructorPh')}
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          value={instructorEmailInput}
          onChange={(e) => setInstructorEmailInput(e.target.value)}
        />
        <select
          aria-label={t('statusLabel')}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-w-[150px]"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ALL">{t('statusOpt.ALL')}</option>
          <option value="VISIBLE">{t('statusOpt.VISIBLE')}</option>
          <option value="HIDDEN">{t('statusOpt.HIDDEN')}</option>
          <option value="PENDING_REPORT">{t('statusOpt.PENDING_REPORT')}</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-surface text-xs font-bold text-ink-muted uppercase">
            <tr>
              <th className="px-6 py-4">{t('cols.course')}</th>
              <th className="px-6 py-4">{t('cols.student')}</th>
              <th className="px-6 py-4">{t('cols.stars')}</th>
              <th className="px-6 py-4">{t('cols.comment')}</th>
              <th className="px-6 py-4">{t('cols.date')}</th>
              <th className="px-6 py-4">{t('cols.status')}</th>
              <th className="px-6 py-4 text-right">{t('cols.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {(!mounted || isLoading) && (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-ink-muted">
                  {t('loading')}
                </td>
              </tr>
            )}
            {mounted && !isLoading && reviews.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-ink-muted">
                  {t('empty')}
                </td>
              </tr>
            )}
            {reviews.map((review) => (
              <tr key={review.id} className="hover:bg-surface">
                <td className="px-6 py-3 font-semibold text-ink">{review.courseTitle}</td>
                <td className="px-6 py-3 text-ink">{review.userName}</td>
                <td className="px-6 py-3 text-ink" aria-label={t('starsLabel', { count: review.rating })}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</td>
                <td className="px-6 py-3 max-w-xs truncate text-ink-muted" title={review.comment ?? ''}>
                  {review.comment || <span className="text-ink-muted">{t('noComment')}</span>}
                </td>
                <td className="px-6 py-3 text-ink-muted">{formatDate(review.createdAt)}</td>
                <td className="px-6 py-3">
                  <div className="flex flex-col items-start gap-1">
                    {review.moderationStatus === 'PENDING_REPORT' ? (
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-ink border border-warning">
                        {t('badge.pending')}
                      </span>
                    ) : review.isHidden ? (
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-danger border border-danger/40">
                        {t('badge.hidden')}
                      </span>
                    ) : (
                      <span className="rounded-full bg-success-tint px-2.5 py-1 text-[11px] font-bold text-success-ink border border-success/30">
                        {t('badge.visible')}
                      </span>
                    )}
                    {review.isHidden && review.moderationReason && (
                      <span className="text-[11px] text-danger font-medium max-w-[150px]">
                        {t('reason', { reason: review.moderationReason })}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 text-right">
                  {review.moderationStatus === 'PENDING_REPORT' ? (
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleUnhide(review.id)}
                        title={t('rejectReportTip')}
                        className="text-xs font-bold text-accent-dark hover:text-ink"
                      >
                        {t('unhide')}
                      </button>
                      <button
                        onClick={() => handleHide(review.id)}
                        title={t('confirmReportTip')}
                        className="text-xs font-bold text-danger hover:opacity-80"
                      >
                        {t('keepHidden')}
                      </button>
                    </div>
                  ) : review.isHidden ? (
                    <button
                      onClick={() => handleUnhide(review.id)}
                      className="text-xs font-bold text-accent-dark hover:text-ink"
                    >
                      {t('unhide')}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleHide(review.id)}
                      className="text-xs font-bold text-danger hover:opacity-80"
                    >
                      {t('hide')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <nav aria-label={t('pager.aria')} className="mt-2 flex items-center justify-between">
          <button
            disabled={data.first}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm font-medium text-ink bg-white border border-line rounded-lg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('pager.prev')}
          </button>
          <span className="text-sm text-ink-muted">
            {t('pager.page', { page: data.number + 1, total: data.totalPages })}
          </span>
          <button
            disabled={data.last}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm font-medium text-ink bg-white border border-line rounded-lg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('pager.next')}
          </button>
        </nav>
      )}
    </div>
  );
}
