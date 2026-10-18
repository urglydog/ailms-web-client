'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CourseRow, ROW_GRID } from '@/components/instructor/courses/CourseRow';
import { CourseStats } from '@/components/instructor/courses/CourseStats';
import { StatusTabs } from '@/components/instructor/courses/StatusTabs';
import { EmptyState } from '@/components/instructor/ui/EmptyState';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDeleteCourse, useMyCourses, useReactivateCourse } from '@/hooks/useCourses';
import { ApiError } from '@/lib/api/client';
import { countByStatus, filterAndSortCourses, type CourseSort, type StatusFilter } from '@/lib/instructor/courseList';
import type { InstructorCourseSummary } from '@/types/domain';

const SORTS: CourseSort[] = ['newest', 'oldest', 'az', 'za'];

/**
 * "Khóa học của tôi" (thiết kế lại): thẻ chỉ số, tab trạng thái có số lượng, tìm kiếm và sắp xếp, mỗi khóa kèm
 * "việc nên làm tiếp" (hoàn thiện, gửi duyệt, xem lý do bị từ chối, kích hoạt lại).
 *
 * Lấy MỘT LẦN toàn bộ khóa của giảng viên rồi lọc/đếm phía client — số khóa của 1 giảng viên nhỏ, và nhờ vậy số
 * lượng ở mọi tab luôn đúng thay vì chỉ có số của tab đang chọn. Chờ mount mới vẽ trạng thái đang tải/trống vì
 * danh sách cần token (máy chủ không có) để HTML hai bên khớp nhau.
 */
export default function InstructorCoursesPage() {
  const t = useTranslations('instructor.courses');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CourseSort>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ ids: number[]; label: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading, error } = useMyCourses({ size: 100 });
  const deleteCourse = useDeleteCourse();
  const reactivateCourse = useReactivateCourse();

  const all = useMemo(() => data?.content ?? [], [data]);
  const counts = useMemo(() => countByStatus(all), [all]);
  const courses = useMemo(() => filterAndSortCourses(all, { status, query, sort }), [all, status, query, sort]);

  const allSelected = courses.length > 0 && courses.every((c) => selectedIds.has(c.id));
  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(courses.map((c) => c.id)));
  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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

  const requestRemove = (course: InstructorCourseSummary) => setDeleteTarget({ ids: [course.id], label: `"${course.title}"` });
  const loading = !mounted || isLoading;

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <CourseStats counts={counts} />

      <StatusTabs counts={counts} active={status} onChange={setStatus} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={15} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setQuery(e.target.value);
            }}
            placeholder={t('search')}
            aria-label={t('searchLabel')}
            className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 text-[13px] text-ink-muted">
          {t('sort.label')}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as CourseSort)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] font-semibold text-ink focus:border-accent focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {t(`sort.${s}`)}
              </option>
            ))}
          </select>
        </label>

        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() => setDeleteTarget({ ids: [...selectedIds], label: t('confirm.many', { count: selectedIds.size }) })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-danger/40 bg-white px-3.5 py-2 text-[13px] font-bold text-danger hover:bg-danger/5"
          >
            <Trash2 size={14} aria-hidden />
            {t('bulk.remove', { count: selectedIds.size })}
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-white p-4 text-sm text-danger">
          {error instanceof ApiError ? error.message : t('loadError')}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <div className={`hidden border-b border-line bg-surface px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-wide text-ink-muted ${ROW_GRID}`}>
          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label={t('row.selectAll')} className="h-4 w-4 accent-accent" />
          <span>{t('row.columns.course')}</span>
          <span>{t('row.columns.status')}</span>
          <span>{t('row.columns.progress')}</span>
          <span>{t('row.columns.next')}</span>
          <span />
        </div>

        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : all.length === 0 ? (
          <EmptyState icon={BookOpen} title={t('empty.noneTitle')} body={t('empty.noneBody')} action={{ href: '/instructor/courses/new', label: t('empty.noneCta') }} />
        ) : courses.length === 0 ? (
          <div className="p-10 text-center text-sm text-ink-muted">{t('empty.filtered')}</div>
        ) : (
          <ul className="m-0 list-none p-0">
            {courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                selected={selectedIds.has(course.id)}
                onToggleSelect={toggleSelect}
                onRemove={requestRemove}
                onReactivate={(id) => reactivateCourse.mutate(id)}
              />
            ))}
          </ul>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal
          title={t('confirm.title')}
          message={t('confirm.message', { label: deleteTarget.label })}
          confirmLabel={t('confirm.confirm')}
          cancelLabel={t('confirm.cancel')}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
