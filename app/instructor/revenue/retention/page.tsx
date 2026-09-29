'use client';

import { useState } from 'react';
import { useInstructorCourseOptions, useLessonRetention } from '@/hooks/useDashboard';
import { useMyCourseDetail } from '@/hooks/useCourses';

/** "Hiệu suất" > Giữ chân (29/09/2026, xây mới — Sprint 3 mục 10, Retention Heatmap / Drop-off
 * Rate): chọn 1 bài học, xem % học viên còn xem tới tại từng mốc 10% thời lượng — chỗ nào tụt
 * mạnh là chỗ học viên hay bỏ ngang. */
export default function RetentionPage() {
  const { data: courses } = useInstructorCourseOptions();
  const [courseId, setCourseId] = useState<number | undefined>(undefined);
  const { data: courseDetail } = useMyCourseDetail(courseId);
  const [lessonId, setLessonId] = useState<number | undefined>(undefined);
  const { data: points, isLoading } = useLessonRetention(lessonId);

  const lessons = (courseDetail?.chapters ?? []).flatMap((ch) =>
    ch.lessons.map((l) => ({ id: l.id, title: `${ch.title} · ${l.title}` })),
  );

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

      {lessonId && points && points.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-end gap-2" style={{ height: 180 }}>
            {points.map((p) => (
              <div key={p.decile} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-[11px] font-bold text-gray-700">{p.retainedPercent.toFixed(0)}%</span>
                <div
                  className="w-full rounded-t bg-cyan-500"
                  style={{ height: `${Math.max(2, p.retainedPercent)}%` }}
                  title={`Đã xem tới ${p.decile * 10}%: còn ${p.retainedPercent.toFixed(1)}% học viên`}
                />
                <span className="text-[10.5px] text-gray-400">{p.decile * 10}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
