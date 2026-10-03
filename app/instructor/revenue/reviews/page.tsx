'use client';

import { useMemo, useState } from 'react';
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
  const [courseId, setCourseId] = useState<number | ''>('');
  const { data: courses } = useInstructorCourseOptions();
  const { data: reviews, isLoading } = useInstructorReviews(courseId || undefined);
  const queryClient = useQueryClient();
  const [reportingId, setReportingId] = useState<number | null>(null);

  // Refined AC (03/10/2026) — Giảng viên report review vi phạm trên khóa của mình, review ẩn
  // ngay + vào hàng chờ Admin duyệt (xem ReviewManager.tsx bên Admin).
  const handleReport = async (reviewId: number) => {
    const reason = window.prompt('Lý do report review này (vi phạm tiêu chuẩn cộng đồng, spam...):') ?? '';
    setReportingId(reviewId);
    try {
      await reviewsApi.report(reviewId, reason);
      toast.success('Đã report — review bị ẩn tạm thời, chờ Admin duyệt.');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'instructor', 'reviews'] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Có lỗi xảy ra khi report review.');
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
        <h1 className="m-0 font-display text-[20px] font-bold text-gray-900">Đánh giá</h1>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : '')}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-semibold text-gray-700 focus:border-cyan-400 focus:outline-none"
        >
          <option value="">Tất cả khóa học</option>
          {courses?.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-[11.5px] font-semibold text-gray-500">Điểm trung bình</span>
            <div className="mt-1 font-display text-[28px] font-extrabold text-amber-500">{stats.avg.toFixed(1)}/5</div>
            <span className="text-[12px] text-gray-400">{stats.total} đánh giá</span>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="mb-1 block text-[11.5px] font-semibold text-gray-500">Phân bố theo số sao</span>
            <div className="h-32 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.distribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="star" width={32} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`${value} đánh giá`, '']} />
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
          Có {recentLowRatingCount} đánh giá {LOW_RATING_ALERT_THRESHOLD}★ trở xuống trong 30 ngày gần đây — nên xem lại nội dung nhận xét bên dưới và phản hồi/liên hệ học viên.
        </InsightCallout>
      )}

      {isLoading && <div className="p-10 text-center text-sm text-gray-500">Đang tải...</div>}
      {!isLoading && (!reviews || reviews.length === 0) && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          Chưa có đánh giá nào.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {reviews?.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="font-semibold text-gray-900">{r.studentName}</span>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-gray-400">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                <button
                  type="button"
                  onClick={() => handleReport(r.id)}
                  disabled={reportingId === r.id}
                  title="Report review này (vi phạm tiêu chuẩn cộng đồng)"
                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-red-500 disabled:opacity-50"
                >
                  <Flag size={13} />
                </button>
              </div>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              <span className="text-[12px] text-gray-400">{r.courseTitle}</span>
            </div>
            {r.comment && <p className="text-[13px] text-gray-700">{r.comment}</p>}
          </div>
        ))}
      </div>
    </>
  );
}
