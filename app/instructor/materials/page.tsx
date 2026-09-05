'use client';

import React, { useState } from 'react';
import { useMyCourses } from '@/hooks/useCourses';
import { CourseMaterialsManager } from '@/components/instructor/CourseMaterialsManager';

import { useRouter } from 'next/navigation';

export default function InstructorMaterialsPage() {
  const router = useRouter();
  const { data, isLoading } = useMyCourses({});
  const courses = data?.content ?? [];
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Chọn khóa học đầu tiên làm mặc định nếu chưa chọn
  const activeCourseId = selectedCourseId ?? courses[0]?.id ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Kho Học Liệu & Đề Thi */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2.5">
            <span>📚</span> Kho Học Liệu & Đề Thi Official
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Quản lý, phát hành và kiểm duyệt toàn bộ Quiz bài thi, Bộ Flashcard và Sơ đồ Mindmap AI cho học viên.
          </p>
        </div>

        {/* Dropdown chọn Khóa học */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-gray-600 whitespace-nowrap">Khóa học:</label>
          <select
            value={activeCourseId ?? ''}
            onChange={(e) => {
              setSelectedCourseId(Number(e.target.value));
              router.push('/instructor/materials');
            }}
            disabled={isLoading || courses.length === 0}
            className="w-full sm:w-64 rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2 text-sm font-semibold text-gray-800 focus:border-cyan-500 focus:bg-white focus:outline-none shadow-sm transition-all"
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
            {courses.length === 0 && <option value="">-- Chưa có khóa học --</option>}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-sm font-semibold text-gray-400 animate-pulse">
          Đang tải danh sách khóa học và học liệu...
        </div>
      ) : activeCourseId ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <CourseMaterialsManager courseId={activeCourseId} />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm font-medium text-gray-500">
          Bạn chưa tạo khóa học nào. Hãy tạo khóa học trước khi phát hành học liệu!
        </div>
      )}
    </div>
  );
}
