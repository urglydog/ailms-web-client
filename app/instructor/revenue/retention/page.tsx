'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { InsightCallout } from '@/components/instructor/InsightCallout';
import { useInstructorCourseOptions, useLessonRetention } from '@/hooks/useDashboard';
import { useMyCourseDetail } from '@/hooks/useCourses';

/** "Hiệu suất" > Giữ chân (29/09/2026, xây mới; nâng cấp chart + insight theo plan redesign —
 * Retention Heatmap / Drop-off Rate): chọn 1 bài học, xem % học viên còn xem tới tại từng mốc
 * 10% thời lượng — chỗ nào tụt mạnh là chỗ học viên hay bỏ ngang. */
export default function RetentionPage() {
  const t = useTranslations('instructor.perf');
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
        <h1 className="m-0 font-display text-[20px] font-bold text-ink">{t('retention.title')}</h1>
        <p className="mt-1 text-[12.5px] text-ink-muted">{t('retention.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-ink-muted">{t('retention.course')}</span>
          <select
            value={courseId ?? ''}
            onChange={(e) => {
              setCourseId(e.target.value ? Number(e.target.value) : undefined);
              setLessonId(undefined);
            }}
            className="min-w-[220px] rounded-lg border border-line px-3 py-1.5 text-[13px] text-ink"
          >
            <option value="">{t('retention.chooseCourse')}</option>
            {courses?.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-ink-muted">{t('retention.lesson')}</span>
          <select
            value={lessonId ?? ''}
            onChange={(e) => setLessonId(e.target.value ? Number(e.target.value) : undefined)}
            disabled={!courseId}
            className="min-w-[260px] rounded-lg border border-line px-3 py-1.5 text-[13px] text-ink disabled:opacity-50"
          >
            <option value="">{t('retention.chooseLesson')}</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </label>
      </div>

      {!lessonId && (
        <div className="rounded-xl border border-line bg-white p-10 text-center text-[13px] text-ink-muted">
          {t('retention.pick')}
        </div>
      )}

      {lessonId && isLoading && (
        <div className="rounded-xl border border-line bg-white p-10 text-center text-sm text-ink-muted">{t('common.loading')}</div>
      )}

      {lessonId && !isLoading && (!points || points.length === 0) && (
        <div className="rounded-xl border border-line bg-white p-10 text-center text-[13px] text-ink-muted">
          {t('retention.noViews')}
        </div>
      )}

      {lessonId && biggestDrop && (
        <InsightCallout tone="warning">
          {t('retention.drop', { from: biggestDrop.from, to: biggestDrop.to, points: biggestDrop.dropPoints.toFixed(0) })}
        </InsightCallout>
      )}

      {lessonId && points && points.length > 0 && (
        <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, t('retention.tooltip')]} labelFormatter={(label) => t('retention.label', { label: String(label) })} />
                <Bar dataKey="retainedPercent" fill="#0891b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
}
