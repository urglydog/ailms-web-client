'use client';

import { useMemo } from 'react';
import { InsightCallout } from '@/components/instructor/InsightCallout';
import { usePerformanceOverview, useRevenueList, useHardQuestions, useInstructorReviews } from '@/hooks/useDashboard';
import { describeGrowth } from '@/lib/instructorInsights';
import { formatMoney } from '@/lib/format';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** "Hiệu suất" > Tổng quan (29/09/2026, viết lại — xem plan redesign) — dashboard tóm tắt thật:
 * KPI chính + câu insight trỏ sang các tab chi tiết, KHÔNG lặp lại bảng giao dịch (đã có ở tab
 * "Doanh thu") như bản cũ. */
export default function PerformanceOverviewPage() {
  const { data: overview, isLoading } = usePerformanceOverview('30d');
  const { data: allRows } = useRevenueList('all');
  const { data: hardQuestions } = useHardQuestions();
  const { data: reviews } = useInstructorReviews();

  // So doanh thu 30 ngày gần nhất với 30 ngày liền trước đó — tính client-side từ toàn bộ lịch
  // sử giao dịch (`getRevenueList('all')`) thay vì gọi thêm endpoint mới.
  const growthText = useMemo(() => {
    if (!allRows) return null;
    const now = Date.now();
    let current = 0;
    let previous = 0;
    for (const r of allRows) {
      const paidAtMs = new Date(r.paidAt).getTime();
      const ageMs = now - paidAtMs;
      if (ageMs >= 0 && ageMs < THIRTY_DAYS_MS) current += r.instructorEarning;
      else if (ageMs >= THIRTY_DAYS_MS && ageMs < 2 * THIRTY_DAYS_MS) previous += r.instructorEarning;
    }
    return describeGrowth(current, previous);
  }, [allRows]);

  const recentLowRatingReview = useMemo(() => {
    if (!reviews) return null;
    const now = Date.now();
    return reviews.find((r) => r.rating <= 2 && now - new Date(r.createdAt).getTime() < SEVEN_DAYS_MS) ?? null;
  }, [reviews]);

  return (
    <>
      <div>
        <h1 className="m-0 font-display text-[20px] font-bold text-gray-900">Tổng quan</h1>
        <p className="mt-1 text-[12.5px] text-gray-500">Nhận thông tin chi tiết hàng đầu về hiệu suất của bạn.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Doanh thu (thực nhận, 30 ngày)" value={isLoading ? '...' : formatMoney(overview?.revenue ?? 0)} />
        <StatCard label="Lượt đăng ký mới" value={isLoading ? '...' : String(overview?.enrollments ?? 0)} />
        <StatCard label="Điểm đánh giá trung bình" value={isLoading ? '...' : (overview?.avgRating ?? 0).toFixed(2)} />
        <StatCard
          label="Câu hỏi khó"
          value={hardQuestions ? String(hardQuestions.length) : '...'}
          tone={hardQuestions && hardQuestions.length > 0 ? 'text-red-600' : 'text-gray-900'}
        />
      </div>

      <div className="flex flex-col gap-2.5">
        {growthText && <InsightCallout tone="info" href="/instructor/revenue/list">{growthText}.</InsightCallout>}

        {hardQuestions && hardQuestions.length > 0 && (
          <InsightCallout tone="warning" href="/instructor/revenue/hard-questions">
            Có {hardQuestions.length} câu hỏi đang bị hơn 60% học viên trả lời sai — xem lại nội dung liên quan.
          </InsightCallout>
        )}

        {recentLowRatingReview && (
          <InsightCallout tone="warning" href="/instructor/revenue/reviews">
            Có đánh giá {recentLowRatingReview.rating}★ mới từ {recentLowRatingReview.studentName} ở khóa &quot;{recentLowRatingReview.courseTitle}&quot; — nên phản hồi sớm.
          </InsightCallout>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value, tone = 'text-gray-900' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className="text-[11.5px] font-semibold text-gray-500">{label}</span>
      <div className={`mt-1 font-display text-[24px] font-extrabold ${tone}`}>{value}</div>
    </div>
  );
}
