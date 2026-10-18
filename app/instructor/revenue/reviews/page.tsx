'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Flag } from 'lucide-react';
import { toast } from 'sonner';
import { InsightCallout } from '@/components/instructor/InsightCallout';
import { useInstructorCourseOptions, useInstructorReviews } from '@/hooks/useDashboard';
import { reviewsApi } from '@/lib/api/reviews';
import { ApiError } from '@/lib/api/client';
import { useQueryClient } from '@tanstack/react-query';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const LOW_RATING_ALERT_THRESHOLD = 2;

/** "Hiệu suất" > Đánh giá (19/09/2026, xây mới; 29/09/2026 bổ sung điểm TB + phân bố sao +
 * insight — xem plan redesign) — đánh giá học viên để lại trên các khóa của giảng viên. */
export default function InstructorReviewsPage() {
  const t = useTranslations('instructor.perf');
  const locale = useLocale();
  const [courseId, setCourseId] = useState<number | ''>('');
  const { data: courses } = useInstructorCourseOptions();
  const { data: reviews, isLoading } = useInstructorReviews(courseId || undefined);
  const queryClient = useQueryClient();
  const [reportingId, setReportingId] = useState<number | null>(null);

  // Refined AC (03/10/2026) — Giảng viên report review vi phạm trên khóa của mình, review ẩn
  // ngay + vào hàng chờ Admin duyệt (xem ReviewManager.tsx bên Admin).
  const handleReport = async (reviewId: number) => {
    const reason = window.prompt(t('reviews.reportPrompt')) ?? '';
    setReportingId(reviewId);
    try {
      await reviewsApi.report(reviewId, reason);
      toast.success(t('reviews.reported'));
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'instructor', 'reviews'] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('reviews.reportError'));
    } finally {
      setReportingId(null);
    }
  };

  const stats = useMemo(() => {
    if (!reviews || reviews.length === 0) return null;
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const distribution = [1, 2, 3, 4, 5].map((star) => ({
      star: `${star}★`,
      count: reviews.filter((r) => r.rating === star).length,
    }));
    return { avg, distribution, total: reviews.length };
  }, [reviews]);

  const recentLowRatingCount = useMemo(() => {
    if (!reviews) return 0;
    const now = Date.now();
    return reviews.filter((r) => r.rating <= LOW_RATING_ALERT_THRESHOLD && now - new Date(r.createdAt).getTime() < THIRTY_DAYS_MS).length;
  }, [reviews]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[20px] font-bold text-ink">{t('reviews.title')}</h1>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : '')}
          className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] font-semibold text-ink focus:border-accent focus:outline-none"
        >
          <option value="">{t('common.allCourses')}</option>
          {courses?.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
          <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <span className="text-[11.5px] font-semibold text-ink-muted">{t('reviews.average')}</span>
            <div className="mt-1 font-display text-[28px] font-extrabold text-amber-500">{stats.avg.toFixed(1)}/5</div>
            <span className="text-[12px] text-ink-muted">{t('reviews.count', { count: stats.total })}</span>
          </div>
          <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <span className="mb-1 block text-[11.5px] font-semibold text-ink-muted">{t('reviews.distribution')}</span>
            <div className="h-32 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.distribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="star" width={32} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [t('reviews.tooltip', { count: Number(value) }), '']} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {stats.distribution.map((d) => (
                      <Cell key={d.star} fill={d.star === '1★' || d.star === '2★' ? '#dc2626' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {recentLowRatingCount >= 2 && (
        <InsightCallout tone="warning">
          {t('reviews.lowAlert', { count: recentLowRatingCount, threshold: LOW_RATING_ALERT_THRESHOLD })}
        </InsightCallout>
      )}

      {isLoading && <div className="p-10 text-center text-sm text-ink-muted">{t('common.loading')}</div>}
      {!isLoading && (!reviews || reviews.length === 0) && (
        <div className="rounded-xl border border-line bg-white p-10 text-center text-sm text-ink-muted shadow-sm">
          {t('reviews.empty')}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {reviews?.map((r) => (
          <div key={r.id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="font-semibold text-ink">{r.studentName}</span>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-ink-muted">{new Date(r.createdAt).toLocaleDateString(locale)}</span>
                <button
                  type="button"
                  onClick={() => handleReport(r.id)}
                  disabled={reportingId === r.id}
                  title={t('reviews.reportTitle')}
                  aria-label={t('reviews.reportTitle')}
                  className="flex items-center gap-1 text-[11px] font-semibold text-ink-muted hover:text-red-500 disabled:opacity-50"
                >
                  <Flag size={13} />
                </button>
              </div>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              <span className="text-[12px] text-ink-muted">{r.courseTitle}</span>
            </div>
            {r.comment && <p className="text-[13px] text-ink">{r.comment}</p>}
          </div>
        ))}
      </div>
    </>
  );
}
