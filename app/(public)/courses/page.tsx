'use client';

import { useMemo, useState } from 'react';
import { CourseCard } from '@/components/course/CourseCard';
import { CourseFilters } from '@/components/course/CourseFilters';
import {
  EMPTY_FILTERS,
  filterCourses,
  MOCK_COURSES,
  type CourseFilterState,
} from '@/lib/mock/courses';

/**
 * Danh sách khoá học + bộ lọc — dịch từ nhánh `isList` của design. UC09.
 *
 * Là Client Component vì bộ lọc là state tương tác. Giai đoạn 2 sẽ:
 *  - đẩy state lọc vào URL search param (chia sẻ được đường dẫn đã lọc),
 *  - thay `filterCourses` client-side bằng query gửi lên backend + phân trang.
 */
export default function CoursesPage() {
  const [filters, setFilters] = useState<CourseFilterState>(EMPTY_FILTERS);

  const results = useMemo(() => filterCourses(MOCK_COURSES, filters), [filters]);

  return (
    <div className="shell py-10">
      <h1 className="mb-2 font-display text-3xl font-bold text-ink">Kho khoá học</h1>
      <p className="mb-8 text-sm text-ink-muted">
        Mọi khoá học đều có thể lồng tiếng sang ngôn ngữ bạn chọn.
      </p>

      {/* Ô tìm kiếm */}
      <div className="mb-8">
        <input
          type="search"
          value={filters.keyword}
          onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          placeholder="Tìm theo tên khoá học hoặc giảng viên…"
          aria-label="Tìm kiếm khoá học"
          className="w-full max-w-xl rounded-full border border-line bg-surface-raised px-5 py-3
                     text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
        />
      </div>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <CourseFilters filters={filters} onChange={setFilters} />

        <section aria-live="polite">
          <p className="mb-4 text-sm text-ink-muted">
            Tìm thấy <strong className="text-ink">{results.length}</strong> khoá học
          </p>

          {results.length === 0 ? (
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
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="mt-1 text-sm font-semibold text-accent underline-offset-4 hover:underline"
              >
                Xoá toàn bộ bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
