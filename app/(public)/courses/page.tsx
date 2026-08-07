'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { CourseCard } from '@/components/course/CourseCard';
import { CourseFilters } from '@/components/course/CourseFilters';
import { useCategories } from '@/hooks/useCategories';
import { useCourseSearch } from '@/hooks/usePublicCourses';
import { EMPTY_FILTERS } from '@/lib/api/publicCourses';
import { ApiError } from '@/lib/api/client';
import type { CourseFilterState, CourseSortBy } from '@/types/domain';

const SORT_OPTIONS: Array<{ value: CourseSortBy; label: string }> = [
  { value: 'relevance', label: 'Phù hợp nhất' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'reviews', label: 'Đánh giá nhiều' },
  { value: 'newest', label: 'Mới nhất' },
];

/**
 * Danh sách khoá học + bộ lọc — dịch từ nhánh `isList` của design. UC09.
 *
 * Client Component vì bộ lọc là state tương tác. Gọi 1 trang kích thước lớn
 * (`publicCoursesApi.search` mặc định size=24) thay vì phân trang thật — khớp cảm
 * giác "hiện hết trong 1 lưới" của mẫu thiết kế, phù hợp với lượng khóa mẫu hiện có.
 * BE vẫn hỗ trợ phân trang thật (`Page<T>`) cho khi dữ liệu lớn hơn.
 *
 * Không có ô tìm kiếm riêng ở đây — chỉ 1 nơi tìm kiếm duy nhất là thanh header
 * (`components/layout/Header.tsx`), điều hướng sang `?q=...`, đọc lại qua
 * `useSearchParams` bên dưới.
 *
 * `useSearchParams` bắt buộc phải nằm trong `<Suspense>` (yêu cầu của Next.js App
 * Router) — tách phần nội dung thật ra `CoursesPageContent`, export default chỉ lo
 * bọc Suspense.
 */
export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="shell py-10 text-sm text-ink-muted">Đang tải…</div>}>
      <CoursesPageContent />
    </Suspense>
  );
}

function CoursesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<CourseFilterState>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<CourseSortBy>('newest');
  const { data: categories } = useCategories();
  const { data: results, isLoading, error } = useCourseSearch(filters, sortBy);

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setFilters((prev) => (prev.keyword === q ? prev : { ...prev, keyword: q }));
  }, [searchParams]);

  const courses = results ?? [];

  return (
    <div className="shell py-10">
      <h1 className="mb-2 font-display text-3xl font-bold text-ink">Kho khoá học</h1>
      <p className="mb-8 text-sm text-ink-muted">
        Mọi khoá học đều có thể lồng tiếng sang ngôn ngữ bạn chọn.
      </p>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <CourseFilters filters={filters} onChange={setFilters} categories={categories ?? []} />

        <section aria-live="polite">
          {error && (
            <div className="card mb-4 p-4 text-sm text-red-600">
              {error instanceof ApiError ? error.message : 'Không tải được danh sách khoá học.'}
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">
              {isLoading ? 'Đang tải…' : (
                <>Tìm thấy <strong className="text-ink">{courses.length}</strong> khoá học</>
              )}
            </p>
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              Sắp xếp:
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as CourseSortBy)}
                className="rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-sm
                           text-ink focus:border-accent focus:outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!isLoading && courses.length === 0 ? (
            /* Trạng thái rỗng — design có nhánh showEmptyState riêng */
            <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="text-3xl" aria-hidden>
                🔍
              </span>
              <span className="font-display text-lg font-semibold text-ink">
                Không tìm thấy khoá học phù hợp
              </span>
              <p className="max-w-sm text-sm text-ink-muted">
                Thử bỏ một vài bộ lọc hoặc dùng từ khoá khác.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  router.push('/courses');
                }}
                className="mt-1 text-sm font-semibold text-accent underline-offset-4 hover:underline"
              >
                Xoá toàn bộ bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
