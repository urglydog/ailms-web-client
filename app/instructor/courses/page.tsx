'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CourseStatusBadge } from '@/components/course/CourseStatusBadge';
import { useDeleteCourse, useMyCourses } from '@/hooks/useCourses';
import { ApiError } from '@/lib/api/client';
import type { CourseStatus } from '@/types/domain';

const STATUS_TABS: Array<{ id: CourseStatus | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'DRAFT', label: 'Nháp' },
  { id: 'PENDING', label: 'Chờ duyệt' },
  { id: 'PUBLISHED', label: 'Đã xuất bản' },
  { id: 'REJECTED', label: 'Bị từ chối' },
  { id: 'ARCHIVED', label: 'Đã lưu trữ' },
];

export default function InstructorCoursesPage() {
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'ALL'>('ALL');
  const { data, isLoading, error } = useMyCourses(
    statusFilter === 'ALL' ? {} : { status: statusFilter },
  );
  const deleteCourse = useDeleteCourse();

  const courses = data?.content ?? [];

  const handleDelete = (id: number, title: string) => {
    if (!window.confirm(`Xóa khóa học "${title}"? Nếu đã có học viên, khóa sẽ được lưu trữ thay vì xóa hẳn.`)) {
      return;
    }
    deleteCourse.mutate(id);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Khóa học của tôi</h1>
        <Link
          href="/instructor/courses/new"
          className="cursor-pointer rounded-full bg-cyan-600 px-5 py-[11px] text-[13.5px] font-bold text-white no-underline hover:bg-cyan-700"
        >
          + Tạo khóa học mới
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
              statusFilter === tab.id
                ? 'bg-cyan-600 text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof ApiError ? error.message : 'Không tải được danh sách khóa học.'}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[52px_1.8fr_120px_110px_90px_150px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-[11.5px] font-bold text-gray-500">
          <span></span>
          <span>Tên khóa học</span>
          <span>Trạng thái</span>
          <span>Giá</span>
          <span>Đánh giá</span>
          <span></span>
        </div>

        {isLoading && <div className="p-10 text-center text-sm text-gray-500">Đang tải...</div>}

        {!isLoading && courses.length === 0 && (
          <div className="p-10 text-center text-sm text-gray-500">Chưa có khóa học nào ở trạng thái này.</div>
        )}

        {courses.map((course, idx) => (
          <div
            key={course.id}
            className={`grid grid-cols-[52px_1.8fr_120px_110px_90px_150px] items-center gap-3 px-4 py-2.5 ${
              idx < courses.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div
              className="h-7 w-10 shrink-0 rounded-md bg-cover bg-center bg-[repeating-linear-gradient(135deg,#0E7490,#0E7490_8px,#0891B2_8px,#0891B2_16px)]"
              style={course.thumbnailUrl ? { backgroundImage: `url(${course.thumbnailUrl})` } : undefined}
            />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-gray-900">
              {course.title}
            </span>
            <CourseStatusBadge status={course.status} />
            <span className="text-[13px] text-gray-500">
              {course.isFree ? 'Miễn phí' : `${course.price.toLocaleString('vi-VN')}đ`}
            </span>
            <span className="text-[13px] text-gray-500">
              {course.avgRating > 0 ? course.avgRating.toFixed(1) : '—'}
            </span>
            <div className="flex justify-end gap-3">
              <Link
                href={`/instructor/courses/${course.id}/edit`}
                className="cursor-pointer text-[12px] font-bold text-cyan-600 no-underline hover:text-cyan-700"
              >
                Sửa
              </Link>
              <button
                onClick={() => handleDelete(course.id, course.title)}
                className="cursor-pointer text-[12px] font-bold text-red-500 hover:text-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
