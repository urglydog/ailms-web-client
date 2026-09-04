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
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const { data, isLoading, error } = useMyCourses(
    statusFilter === 'ALL' ? {} : { status: statusFilter },
  );
  const deleteCourse = useDeleteCourse();

  const courses = data?.content ?? [];

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteCourse.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
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
                onClick={() => setDeleteTarget({ id: course.id, title: course.title })}
                className="cursor-pointer text-[12px] font-bold text-red-500 hover:text-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-bold text-base text-gray-900">Xác nhận xóa khóa học</h3>
            </div>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa khóa học <strong className="text-gray-900">&quot;{deleteTarget.title}&quot;</strong>? Nếu đã có học viên, khóa sẽ chuyển sang lưu trữ. Nếu chưa có học viên, toàn bộ nội dung sẽ bị xóa vĩnh viễn.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-700 transition-all"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
