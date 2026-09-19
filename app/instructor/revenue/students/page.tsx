'use client';

import { useState } from 'react';
import { DownloadIcon } from '@/components/instructor/SidebarIcons';
import { useInstructorCourseOptions, useInstructorStudents } from '@/hooks/useDashboard';
import { exportToCsv } from '@/lib/exportCsv';

/** "Hiệu suất" > Sinh viên — danh sách học viên đã ghi danh trên các khóa của giảng viên
 * (19/09/2026, xây mới — trước đây `/instructor/students` chỉ là placeholder). */
export default function InstructorStudentsPage() {
  const [courseId, setCourseId] = useState<number | ''>('');
  const { data: courses } = useInstructorCourseOptions();
  const { data: students, isLoading } = useInstructorStudents(courseId || undefined);

  const handleExport = () => {
    if (!students || students.length === 0) return;
    exportToCsv(
      'hoc-vien.csv',
      students.map((s) => ({
        'Học viên': s.studentName,
        Email: s.studentEmail,
        'Khóa học': s.courseTitle,
        'Ngày ghi danh': new Date(s.enrolledAt).toLocaleDateString('vi-VN'),
        'Tiến độ (%)': s.progressPct,
      })),
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[20px] font-bold text-gray-900">Học viên</h1>
        <div className="flex items-center gap-2">
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
          <button
            type="button"
            onClick={handleExport}
            disabled={!students || students.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon /> Xuất CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.4fr_1.4fr_1fr_140px_140px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-[11.5px] font-bold text-gray-500">
          <span>Học viên</span>
          <span>Email</span>
          <span>Khóa học</span>
          <span>Ngày ghi danh</span>
          <span>Tiến độ</span>
        </div>

        {isLoading && <div className="p-10 text-center text-sm text-gray-500">Đang tải...</div>}
        {!isLoading && (!students || students.length === 0) && (
          <div className="p-10 text-center text-sm text-gray-500">Chưa có học viên nào ghi danh.</div>
        )}

        {students?.map((s, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-[1.4fr_1.4fr_1fr_140px_140px] items-center gap-3 px-4 py-2.5 text-[13px] ${
              idx < students.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <span className="truncate font-semibold text-gray-900">{s.studentName}</span>
            <span className="truncate text-gray-500">{s.studentEmail}</span>
            <span className="truncate text-gray-700">{s.courseTitle}</span>
            <span className="text-gray-500">{new Date(s.enrolledAt).toLocaleDateString('vi-VN')}</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${s.progressPct}%` }} />
              </div>
              <span className="text-[11.5px] text-gray-500">{s.progressPct}%</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
