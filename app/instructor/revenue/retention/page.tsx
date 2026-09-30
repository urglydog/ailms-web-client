'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { InsightCallout } from '@/components/instructor/InsightCallout';
import { useInstructorCourseOptions, useLessonRetention } from '@/hooks/useDashboard';
import { useMyCourseDetail } from '@/hooks/useCourses';

/** "Hiệu suất" > Giữ chân (29/09/2026, xây mới; nâng cấp chart + insight theo plan redesign —
 * Retention Heatmap / Drop-off Rate): chọn 1 bài học, xem % học viên còn xem tới tại từng mốc
 * 10% thời lượng — chỗ nào tụt mạnh là chỗ học viên hay bỏ ngang. */
export default function RetentionPage() {
  const { data: courses } = useInstructorCourseOptions();
  const [courseId, setCourseId] = useState<number | undefined>(undefined);
  const { data: courseDetail } = useMyCourseDetail(courseId);
  const [lessonId, setLessonId] = useState<number | undefined>(undefined);
  const { data: points, isLoading } = useLessonRetention(lessonId);

  const lessons = (courseDetail?.chapters ?? []).flatMap((ch) =>
    ch.lessons.map((l) => ({ id: l.id, title: `${ch.title} · ${l.title}` })),
  );

  const chartData = useMemo(() => (points ?? []).map((p) => ({ ...p, label: `${p.decile * 10}%` })), [points]);

  // Tìm 2 decile liên tiếp tụt mạnh nhất — đây chính là đoạn video học viên hay bỏ ngang nhất.
  const biggestDrop = useMemo(() => {
    if (!points || points.length < 2) return null;
    let best: { from: number; to: number; dropPoints: number } | null = null;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      if (!prev || !curr) continue;
      const drop = prev.retainedPercent - curr.retainedPercent;
      if (drop > 0 && (!best || drop > best.dropPoints)) {
        best = { from: prev.decile * 10, to: curr.decile * 10, dropPoints: drop };
      }
    }
    return best;
  }, [points]);

  return (
    <>
      <div>
        <h1 className="m-0 font-display text-[20px] font-bold text-gray-900">Giữ chân học viên</h1>
        <p className="mt-1 text-[12.5px] text-gray-500">% học viên còn xem tới từng mốc 10% thời lượng video — chỗ tụt mạnh là chỗ dễ bỏ ngang.</p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-gray-500">Khóa học</span>
          <select
            value={courseId ?? ''}
            onChange={(e) => {
              setCourseId(e.target.value ? Number(e.target.value) : undefined);
              setLessonId(undefined);
            }}
            className="min-w-[220px] rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] text-gray-800"
          >
            <option value="">— Chọn khóa học —</option>
            {courses?.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-gray-500">Bài học</span>
          <select
            value={lessonId ?? ''}
            onChange={(e) => setLessonId(e.target.value ? Number(e.target.value) : undefined)}
            disabled={!courseId}
            className="min-w-[260px] rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] text-gray-800 disabled:opacity-50"
          >
            <option value="">— Chọn bài học —</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </label>
      </div>

      {!lessonId && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-[13px] text-gray-400">
          Chọn khóa học và bài học để xem biểu đồ giữ chân.
        </div>
      )}

      {lessonId && isLoading && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Đang tải...</div>
      )}

      {lessonId && !isLoading && (!points || points.length === 0) && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-[13px] text-gray-400">
          Bài học này chưa có học viên nào xem — chưa đủ dữ liệu để vẽ biểu đồ.
        </div>
      )}

      {lessonId && biggestDrop && (
        <InsightCallout tone="warning">
          Học viên rớt mạnh nhất giữa {biggestDrop.from}%–{biggestDrop.to}% video (giảm {biggestDrop.dropPoints.toFixed(0)} điểm %) — xem lại đoạn này, có thể đang dài hoặc khó hiểu.
        </InsightCallout>
      )}

      {lessonId && points && points.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Còn xem tới đây']} labelFormatter={(label) => `Đã xem tới ${label}`} />
                <Bar dataKey="retainedPercent" fill="#0891b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
}
