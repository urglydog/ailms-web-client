'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { InsightCallout } from '@/components/instructor/InsightCallout';
import { MetricCard } from '@/components/instructor/performance/MetricCard';
import { RevenueBars } from '@/components/instructor/performance/RevenueBars';
import { usePerformanceOverview, useRevenueList, useHardQuestions, useInstructorReviews } from '@/hooks/useDashboard';
import { dailyEarnings, growthTrend } from '@/lib/instructorInsights';
import { formatMoney } from '@/lib/shop/money';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** "Hiệu suất" > Tổng quan — dashboard tóm tắt thật: 4 chỉ số chính, biểu đồ doanh thu 30 ngày và các câu insight trỏ sang
 * tab chi tiết; KHÔNG lặp lại bảng giao dịch (đã có ở tab "Doanh thu"). Số liệu cần token nên chờ mount mới hiện, để HTML
 * máy chủ và máy khách khớp nhau. */
export default function PerformanceOverviewPage() {
  const t = useTranslations('instructor.performance.overview');
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { data: overview, isLoading } = usePerformanceOverview('30d');
  const { data: allRows } = useRevenueList('all');
  const { data: hardQuestions } = useHardQuestions();
  const { data: reviews } = useInstructorReviews();

  // So doanh thu 30 ngày gần nhất với 30 ngày liền trước đó — tính client-side từ toàn bộ lịch sử giao dịch.
  const growth = useMemo(() => {
    if (!allRows) return null;
    const now = Date.now();
    let current = 0;
    let previous = 0;
    for (const r of allRows) {
      const ageMs = now - new Date(r.paidAt).getTime();
      if (ageMs >= 0 && ageMs < THIRTY_DAYS_MS) current += r.instructorEarning;
      else if (ageMs >= THIRTY_DAYS_MS && ageMs < 2 * THIRTY_DAYS_MS) previous += r.instructorEarning;
    }
    return growthTrend(current, previous);
  }, [allRows]);

  const series = useMemo(() => dailyEarnings(allRows ?? [], 30), [allRows]);

  const recentLowRatingReview = useMemo(() => {
    if (!reviews) return null;
    const now = Date.now();
    return reviews.find((r) => r.rating <= 2 && now - new Date(r.createdAt).getTime() < SEVEN_DAYS_MS) ?? null;
  }, [reviews]);

  const loading = !mounted || isLoading;
  const placeholder = '...';
  const hardCount = hardQuestions?.length ?? 0;

  return (
    <>
      <div>
        <h1 className="m-0 font-display text-[20px] font-bold text-ink">{t('title')}</h1>
        <p className="mt-1 text-[12.5px] text-ink-muted">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label={t('kpi.revenue')} value={loading ? placeholder : formatMoney(overview?.revenue ?? 0, locale)} />
        <MetricCard label={t('kpi.enrollments')} value={loading ? placeholder : String(overview?.enrollments ?? 0)} />
        <MetricCard label={t('kpi.rating')} value={loading ? placeholder : (overview?.avgRating ?? 0).toFixed(2)} />
        <MetricCard
          label={t('kpi.hardQuestions')}
          value={hardQuestions ? String(hardCount) : placeholder}
          tone={hardCount > 0 ? 'warning' : 'default'}
        />
      </div>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
        <h2 className="m-0 mb-4 font-display text-[15px] font-bold text-ink">{t('chart.title')}</h2>
        {mounted && allRows ? <RevenueBars series={series} /> : <p className="m-0 text-sm text-ink-muted">{placeholder}</p>}
      </section>

      <div className="flex flex-col gap-2.5">
        {mounted && growth && (
          <InsightCallout tone="info" href="/instructor/revenue/list">
            {growth.kind === 'up' || growth.kind === 'down' ? t(`growth.${growth.kind}`, { percent: growth.percent }) : t(`growth.${growth.kind}`)}.
          </InsightCallout>
        )}

        {mounted && hardCount > 0 && (
          <InsightCallout tone="warning" href="/instructor/revenue/hard-questions">
            {t('hard', { count: hardCount })}
          </InsightCallout>
        )}

        {mounted && recentLowRatingReview && (
          <InsightCallout tone="warning" href="/instructor/revenue/reviews">
            {t('lowRating', {
              rating: recentLowRatingReview.rating,
              student: recentLowRatingReview.studentName,
              course: recentLowRatingReview.courseTitle,
            })}
          </InsightCallout>
        )}
      </div>
    </>
  );
}
