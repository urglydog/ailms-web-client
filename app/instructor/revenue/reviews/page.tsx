'use client';

import { useState } from 'react';
import { useInstructorCourseOptions, useInstructorReviews } from '@/hooks/useDashboard';

/** "Hiệu suất" > Đánh giá — đánh giá học viên để lại trên các khóa của giảng viên (19/09/2026,
 * xây mới). */
export default function InstructorReviewsPage() {
  const [courseId, setCourseId] = useState<number | ''>('');
  const { data: courses } = useInstructorCourseOptions();
  const { data: reviews, isLoading } = useInstructorReviews(courseId || undefined);

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

      {isLoading && <div className="p-10 text-center text-sm text-gray-500">Đang tải...</div>}
      {!isLoading && (!reviews || reviews.length === 0) && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          Chưa có đánh giá nào.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {reviews?.map((r, idx) => (
          <div key={idx} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="font-semibold text-gray-900">{r.studentName}</span>
              <span className="text-[12px] text-gray-400">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
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
