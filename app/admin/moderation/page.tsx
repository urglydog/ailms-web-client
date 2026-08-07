'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CourseStatusBadge } from '@/components/course/CourseStatusBadge';
import { useModerationQueue } from '@/hooks/useCourses';
import { ApiError } from '@/lib/api/client';
import type { CourseStatus } from '@/types/domain';

const STATUS_TABS: Array<{ id: CourseStatus; label: string }> = [
  { id: 'PENDING', label: 'Chờ duyệt' },
  { id: 'PUBLISHED', label: 'Đã xuất bản' },
  { id: 'REJECTED', label: 'Bị từ chối' },
  { id: 'ARCHIVED', label: 'Đã lưu trữ' },
];

export default function AdminModerationPage() {
  const [statusFilter, setStatusFilter] = useState<CourseStatus>('PENDING');
  const { data, isLoading, error } = useModerationQueue({ status: statusFilter });

  const courses = data?.content ?? [];

  return (
    <>
      <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Kiểm duyệt khóa học</h1>

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
        <div className="grid grid-cols-[52px_1.8fr_130px_120px_100px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-[11.5px] font-bold text-gray-500">
          <span></span>
          <span>Tên khóa học</span>
          <span>Danh mục</span>
          <span>Trạng thái</span>
          <span></span>
        </div>

        {isLoading && <div className="p-10 text-center text-sm text-gray-500">Đang tải...</div>}

        {!isLoading && courses.length === 0 && (
          <div className="p-10 text-center text-sm text-gray-500">Không có khóa học nào ở trạng thái này.</div>
        )}

        {courses.map((course, idx) => (
          <div
            key={course.id}
            className={`grid grid-cols-[52px_1.8fr_130px_120px_100px] items-center gap-3 px-4 py-2.5 ${
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
            <span className="text-[12.5px] text-gray-500">{course.categoryName}</span>
            <CourseStatusBadge status={course.status} />
            <Link
              href={`/admin/moderation/${course.id}`}
              className="justify-self-end text-[12px] font-bold text-cyan-600 no-underline hover:text-cyan-700"
            >
              Xem trước
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
