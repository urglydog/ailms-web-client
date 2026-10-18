'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { SearchX, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CourseCard } from '@/components/course/CourseCard';
import { CourseFilters } from '@/components/course/CourseFilters';
import { ActiveFilters } from '@/components/course/list/ActiveFilters';
import { CategoryChips } from '@/components/course/list/CategoryChips';
import { CourseRowCard } from '@/components/course/list/CourseRowCard';
import { ViewToggle, type CourseListView } from '@/components/course/list/ViewToggle';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCategories } from '@/hooks/useCategories';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { useCourseSearch } from '@/hooks/usePublicCourses';
import { EMPTY_FILTERS } from '@/lib/api/publicCourses';
import { clearFilter } from '@/lib/courses/filterChips';
import { resolveCategoryParam } from '@/lib/courses/categoryParam';
import { ApiError } from '@/lib/api/client';
import type { CourseFilterState, CourseSortBy } from '@/types/domain';

const SORTS: CourseSortBy[] = ['relevance', 'rating', 'reviews', 'newest'];
const VIEW_KEY = 'courses-view';

/**
 * Kho khóa học + bộ lọc (UC09). Client Component vì bộ lọc là state tương tác. Gọi 1 trang kích thước lớn
 * (`publicCoursesApi.search` mặc định size=24) thay vì phân trang thật, phù hợp với lượng khóa hiện có; BE vẫn
 * hỗ trợ phân trang thật cho khi dữ liệu lớn hơn.
 *
 * Không có ô tìm kiếm riêng ở đây — chỉ 1 nơi tìm kiếm duy nhất là thanh header, điều hướng sang `?q=...`, đọc lại
 * qua `useSearchParams`. `useSearchParams` bắt buộc nằm trong `<Suspense>`, nên nội dung thật tách ra
 * `CoursesPageContent`.
 *
 * Bố cục: dải đầu trang sáng có chip danh mục lọc nhanh, dải chip bộ lọc đang bật, thanh công cụ (số kết quả, sắp
 * xếp, đổi dạng thẻ/danh sách), cột bộ lọc bên trái (trên điện thoại thu gọn sau nút "Bộ lọc").
 */
export default function CoursesPage() {
  return (
    <Suspense fallback={<LoadingNote />}>
      <CoursesPageContent />
    </Suspense>
  );
}

function LoadingNote() {
  const t = useTranslations('courseList');
  return <div className="shell py-10 text-sm text-ink-muted">{t('loading')}</div>;
}

function CoursesPageContent() {
  const t = useTranslations('courseList');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<CourseFilterState>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<CourseSortBy>('newest');
  const [view, setView] = useState<CourseListView>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: loadedCategories } = useCategories();
  // Danh mục có thể đã nằm sẵn trong cache của trình duyệt khi hydrate còn máy chủ thì chưa có; chỉ dùng sau khi đã
  // mount để HTML hai bên khớp nhau (cùng cách xử lý với trang Khóa học của tôi).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const categories = mounted ? loadedCategories : undefined;
  const { data: results, isLoading, error } = useCourseSearch(filters, sortBy);
  const { data: enrollments } = useMyEnrollments();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_KEY);
      if (stored === 'grid' || stored === 'list') setView(stored);
    } catch {
      /* không có localStorage thì giữ mặc định dạng thẻ */
    }
  }, []);

  const changeView = (next: CourseListView) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* bỏ qua */
    }
  };

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setFilters((prev) => (prev.keyword === q ? prev : { ...prev, keyword: q }));
  }, [searchParams]);

  // Liên kết từ menu "Khám phá" (`/courses?category=<slug>`): áp bộ lọc danh mục khi danh mục đã tải.
  useEffect(() => {
    const slug = resolveCategoryParam(searchParams.get('category'), categories ?? []);
    setFilters((prev) => (prev.category === slug ? prev : { ...prev, category: slug }));
  }, [searchParams, categories]);

  // Khóa học ĐÃ SỞ HỮU không còn liệt kê ở đây (06/09/2026) — trang này chỉ gợi ý khóa CHƯA mua. Khách chưa
  // đăng nhập (`enrollments` là `undefined`) thì không lọc gì.
  const allResults = results ?? [];
  const courses = enrollments
    ? allResults.filter((course) => !enrollments.some((e) => e.courseId === course.id))
    : allResults;

  const resetAll = () => {
    setFilters(EMPTY_FILTERS);
    router.push('/courses');
  };

  return (
    <div>
      <div className="border-b border-line bg-tint">
        <div className="shell py-8">
          <h1 className="mb-1 font-display text-3xl font-bold text-ink">{t('title')}</h1>
          <p className="mb-5 text-sm text-ink-muted">{t('subtitle')}</p>
          <CategoryChips
            categories={categories ?? []}
            selected={filters.category}
            onSelect={(slug) => setFilters((prev) => ({ ...prev, category: slug }))}
          />
        </div>
      </div>

      <div className="shell py-8">
        <ActiveFilters
          filters={filters}
          categories={categories ?? []}
          onClear={(key) => setFilters((prev) => clearFilter(prev, key))}
          onClearAll={resetAll}
        />

        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <div className={filtersOpen ? 'block' : 'hidden lg:block'}>
            <CourseFilters filters={filters} onChange={setFilters} categories={categories ?? []} />
          </div>

          <section aria-live="polite">
            {error && (
              <div className="card mb-4 p-4 text-sm text-danger">
                {error instanceof ApiError ? error.message : t('loadError')}
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFiltersOpen((v) => !v)}
                  aria-expanded={filtersOpen}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-sm font-semibold text-accent-dark lg:hidden"
                >
                  <SlidersHorizontal size={15} aria-hidden />
                  {t('filtersToggle')}
                </button>
                <p className="m-0 text-sm text-ink-muted">
                  {isLoading ? t('loading') : t.rich('found', { count: courses.length, b: (chunks) => <strong className="text-ink">{chunks}</strong> })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-ink-muted">
                  {t('sort.label')}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as CourseSortBy)}
                    className="rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
                  >
                    {SORTS.map((value) => (
                      <option key={value} value={value}>
                        {t(`sort.${value}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <ViewToggle view={view} onChange={changeView} />
              </div>
            </div>

            {isLoading ? (
              <div className={view === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-3'}>
                {Array.from({ length: view === 'grid' ? 6 : 4 }, (_, i) => (
                  <Skeleton key={i} className={view === 'grid' ? 'h-64' : 'h-32'} />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
                <SearchX size={32} aria-hidden className="text-accent" />
                <span className="font-display text-lg font-semibold text-ink">{t('empty.title')}</span>
                <p className="max-w-sm text-sm text-ink-muted">{t('empty.body')}</p>
                <button
                  type="button"
                  onClick={resetAll}
                  className="mt-1 text-sm font-semibold text-accent-dark underline-offset-4 hover:underline"
                >
                  {t('empty.clear')}
                </button>
              </div>
            ) : view === 'grid' ? (
              <div data-view="grid" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div data-view="list" className="flex flex-col gap-3">
                {courses.map((course) => (
                  <CourseRowCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
