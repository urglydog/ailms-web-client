'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, type KeyboardEvent } from 'react';
import { PencilIcon, TrashIcon } from '@/components/instructor/CurriculumIcons';
import { SearchIcon } from '@/components/instructor/SidebarIcons';
import { CourseStatusBadge } from '@/components/course/CourseStatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useDeleteCourse, useMyCourses, useReactivateCourse } from '@/hooks/useCourses';
import { ApiError } from '@/lib/api/client';
import type { CourseStatus, InstructorCourseSummary } from '@/types/domain';

const STATUS_TABS: Array<{ id: CourseStatus | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'DRAFT', label: 'Nháp' },
  { id: 'PENDING', label: 'Chờ duyệt' },
  { id: 'PUBLISHED', label: 'Đã xuất bản' },
  { id: 'REJECTED', label: 'Bị từ chối' },
  { id: 'ARCHIVED', label: 'Đã lưu trữ' },
];

type SortOption = 'newest' | 'oldest' | 'az' | 'za';
const SORT_LABEL: Record<SortOption, string> = {
  newest: 'Mới nhất',
  oldest: 'Cũ nhất',
  az: 'A-Z',
  za: 'Z-A',
};

function sortCourses(courses: InstructorCourseSummary[], sort: SortOption): InstructorCourseSummary[] {
  const sorted = [...courses];
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'oldest':
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case 'az':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'za':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
  }
}

/**
 * "Các khóa học" — giao diện tham khảo Udemy (19/09/2026, redesign):
 * ô tìm kiếm (lọc client-side theo tên — danh sách khóa của 1 giảng viên thường không nhiều,
 * không cần gọi API riêng), sort (Mới nhất/Cũ nhất/A-Z/Z-A), thanh "Hoàn thành khóa học" (%),
 * icon Sửa/Xóa hiện thường trực (19/09/2026 — bỏ hover-only vì để bảng trống trải), checkbox
 * chọn nhiều để xóa hàng loạt. Bỏ cột "Đánh giá" theo yêu cầu.
 */
export default function InstructorCoursesPage() {
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'ALL'>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ ids: number[]; label: string } | null>(null);

  const { data, isLoading, error } = useMyCourses(statusFilter === 'ALL' ? {} : { status: statusFilter });
  const deleteCourse = useDeleteCourse();
  const reactivateCourse = useReactivateCourse();

  const submitSearch = () => setSearchQuery(searchInput.trim());
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitSearch();
  };

  const courses = useMemo(() => {
    const all = data?.content ?? [];
    const filtered = searchQuery
      ? all.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : all;
    return sortCourses(filtered, sort);
  }, [data, searchQuery, sort]);

  const allSelected = courses.length > 0 && courses.every((c) => selectedIds.has(c.id));
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(courses.map((c) => c.id)));
  };
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteTarget.ids.forEach((id) => deleteCourse.mutate(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      deleteTarget.ids.forEach((id) => next.delete(id));
      return next;
    });
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Các khóa học</h1>
        <Link
          href="/instructor/courses/new"
          className="cursor-pointer rounded-full bg-cyan-600 px-5 py-[11px] text-[13.5px] font-bold text-white no-underline hover:bg-cyan-700"
        >
          + Khóa học mới
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

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex w-full max-w-xs">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Tìm khóa học của bạn..."
            className="w-full rounded-l-lg border border-r-0 border-gray-200 px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={submitSearch}
            aria-label="Tìm kiếm"
            className="flex shrink-0 items-center justify-center rounded-r-lg border border-cyan-600 bg-cyan-600 px-3.5 text-white hover:bg-cyan-700"
          >
            <SearchIcon />
          </button>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSortMenu((v) => !v)}
            className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-gray-700 hover:border-gray-300"
          >
            {SORT_LABEL[sort]} ▾
          </button>
          {showSortMenu && (
            <div className="absolute left-0 top-full z-10 mt-1 w-36 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {(Object.keys(SORT_LABEL) as SortOption[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSort(option);
                    setShowSortMenu(false);
                  }}
                  className={`block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-gray-50 ${
                    sort === option ? 'font-bold text-cyan-700' : 'text-gray-700'
                  }`}
                >
                  {SORT_LABEL[option]}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() =>
              setDeleteTarget({ ids: [...selectedIds], label: `${selectedIds.size} khóa học đã chọn` })
            }
            className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-[13px] font-bold text-red-600 hover:bg-red-100"
          >
            Gỡ bỏ đã chọn ({selectedIds.size})
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof ApiError ? error.message : 'Không tải được danh sách khóa học.'}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[36px_52px_1.6fr_120px_140px_90px] items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-[11.5px] font-bold text-gray-500">
          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-cyan-600" />
          <span></span>
          <span>Tên khóa học</span>
          <span>Trạng thái</span>
          <span>Hoàn thành khóa học</span>
          <span></span>
        </div>

        {isLoading && <div className="p-10 text-center text-sm text-gray-500">Đang tải...</div>}

        {!isLoading && courses.length === 0 && (
          <div className="p-10 text-center text-sm text-gray-500">Chưa có khóa học nào ở trạng thái này.</div>
        )}

        {courses.map((course, idx) => (
          <div
            key={course.id}
            className={`group grid grid-cols-[36px_52px_1.6fr_120px_140px_90px] items-center gap-3 px-4 py-2.5 ${
              idx < courses.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(course.id)}
              onChange={() => toggleSelect(course.id)}
              className="accent-cyan-600"
            />
            <div className="relative h-7 w-10 shrink-0 overflow-hidden rounded-md bg-[repeating-linear-gradient(135deg,#0E7490,#0E7490_8px,#0891B2_8px,#0891B2_16px)]">
              {course.thumbnailUrl && (
                <Image src={course.thumbnailUrl} alt={course.title} fill sizes="40px" className="object-cover" />
              )}
            </div>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-gray-900">
              {course.title}
            </span>
            <CourseStatusBadge status={course.status} />
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${course.completionPercent >= 100 ? 'bg-green-500' : 'bg-cyan-500'}`}
                  style={{ width: `${course.completionPercent}%` }}
                />
              </div>
              <span className="text-[11.5px] text-gray-500">{course.completionPercent}%</span>
            </div>
            <div className="flex justify-end gap-3">
              <Link
                href={`/instructor/courses/${course.id}/edit`}
                title="Chỉnh sửa"
                className="text-gray-400 hover:text-cyan-700"
              >
                <PencilIcon className="h-4 w-4" />
              </Link>
              {course.status === 'ARCHIVED' ? (
                <button
                  type="button"
                  onClick={() => reactivateCourse.mutate(course.id)}
                  disabled={reactivateCourse.isPending}
                  title="Kích hoạt lại"
                  className="text-[11.5px] font-bold text-cyan-700 hover:text-cyan-900 disabled:opacity-50"
                >
                  Kích hoạt lại
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ ids: [course.id], label: `"${course.title}"` })}
                  title="Gỡ bỏ"
                  className="text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {deleteTarget && (
        <ConfirmModal
          title="Gỡ bỏ khóa học"
          message={`Bạn có chắc chắn muốn gỡ bỏ ${deleteTarget.label}? Học viên mới sẽ không tìm và ghi danh được nữa, nhưng học viên đã ghi danh vẫn giữ nguyên quyền truy cập. Đây không phải xóa vĩnh viễn — bạn có thể kích hoạt lại bất cứ lúc nào trong trang chỉnh sửa khóa học.`}
          confirmLabel="Gỡ bỏ"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
