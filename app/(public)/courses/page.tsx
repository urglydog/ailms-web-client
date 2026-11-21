'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CourseCard } from '@/components/course/CourseCard';
import { CategoryFeaturedShelf } from '@/components/course/list/CategoryFeaturedShelf';
import { CourseFilterBar } from '@/components/course/CourseFilterBar';
import { ActiveFilters } from '@/components/course/list/ActiveFilters';
import { CourseRowCard } from '@/components/course/list/CourseRowCard';
import { ViewToggle, type CourseListView } from '@/components/course/list/ViewToggle';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCategories } from '@/hooks/useCategories';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { useCourseSearchInfinite } from '@/hooks/usePublicCourses';
import { useLoadMoreOnScroll } from '@/hooks/useLoadMoreOnScroll';
import { useDebounce } from '@/hooks/useDebounce';
import { EMPTY_FILTERS } from '@/lib/api/publicCourses';
import { clearFilter } from '@/lib/courses/filterChips';
import { resolveCategoryParam } from '@/lib/courses/categoryParam';
import { ApiError } from '@/lib/api/client';
import type { CourseFilterState, CourseSortBy } from '@/types/domain';

const SORTS: CourseSortBy[] = ['relevance', 'rating', 'reviews', 'newest'];
const VIEW_KEY = 'courses-view';
const FILTER_DEBOUNCE_MS = 300;

/**
 * Kho khóa học + bộ lọc (UC09). Client Component vì bộ lọc là state tương tác. TẢI DẦN khi cuộn
 * (infinite scroll, 08/11/2026): mỗi lần 24 khóa từ server, cuộn gần cuối tự tải tiếp; nút "Xem thêm"
 * dự phòng cho bàn phím/trình đọc màn hình. Đổi bộ lọc/sắp xếp thì bắt đầu lại từ đầu.
 *
 * Không có ô tìm kiếm riêng ở đây — chỉ 1 nơi tìm kiếm duy nhất là thanh header, điều hướng sang `?q=...`, đọc lại
 * qua `useSearchParams`. `useSearchParams` bắt buộc nằm trong `<Suspense>`, nên nội dung thật tách ra
 * `CoursesPageContent`.
 *
 * Bố cục (08/11/2026): dải tiêu đề; thanh công cụ gồm bộ lọc NGANG (popover từng nhóm) + sắp xếp + dạng
 * hiển thị; chip bộ lọc đang bật; lưới khóa học dùng hết chiều ngang (tối đa 4 cột); nút/mốc tải thêm.
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
  const { data: loadedCategories } = useCategories();
  // Danh mục có thể đã nằm sẵn trong cache của trình duyệt khi hydrate còn máy chủ thì chưa có; chỉ dùng sau khi đã
  // mount để HTML hai bên khớp nhau (cùng cách xử lý với trang Khóa học của tôi).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const categories = mounted ? loadedCategories : undefined;
  // Debounce 300ms: người dùng đổi liền nhiều bộ lọc thì chỉ gửi request cho tổ hợp cuối cùng.
  const queryFilters = useDebounce(filters, FILTER_DEBOUNCE_MS);
  const querySort = useDebounce(sortBy, FILTER_DEBOUNCE_MS);
  const { data, isLoading, isFetching, isPlaceholderData, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCourseSearchInfinite(queryFilters, querySort);
  // Đang chờ kết quả lọc mới (gồm cả khoảng debounce) → làm mờ lưới cũ thay vì xóa trắng.
  const refreshing = queryFilters !== filters || querySort !== sortBy || (isFetching && isPlaceholderData);
  const { data: enrollments } = useMyEnrollments();
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  };
  const sentinelRef = useLoadMoreOnScroll<HTMLDivElement>(!!hasNextPage && !isFetchingNextPage && !isPlaceholderData, loadMore);

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
  const pageItemsList = data?.pages.flatMap((p) => p.items) ?? [];
  const courses = enrollments
    ? pageItemsList.filter((course) => !enrollments.some((e) => e.courseId === course.id))
    : pageItemsList;

  const resetAll = () => {
    setFilters(EMPTY_FILTERS);
    router.push('/courses');
  };

  const gridClass = 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div>
      <div className="border-b border-line bg-tint">
        <div className="shell py-8">
          <h1 className="mb-1 font-display text-3xl font-bold text-ink">{t('title')}</h1>
          <p className="text-sm text-ink-muted">{t('subtitle')}</p>
        </div>
      </div>

      <div className="shell py-6">
        {/* Thanh công cụ: bộ lọc ngang (trái), sắp xếp + dạng hiển thị (phải) */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <CourseFilterBar filters={filters} onChange={setFilters} categories={categories ?? []} />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              {t('sort.label')}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as CourseSortBy)}
                className="min-h-10 rounded-lg border border-line bg-surface-raised px-3 text-sm text-ink focus:border-accent focus:outline-none"
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

        <ActiveFilters
          filters={filters}
          categories={categories ?? []}
          onClear={(key) => setFilters((prev) => clearFilter(prev, key))}
          onClearAll={resetAll}
        />

        {filters.category && !filters.keyword && <CategoryFeaturedShelf categorySlug={filters.category} />}

        <section aria-busy={refreshing || isFetchingNextPage}>
          {error && (
            <div className="card mb-4 p-4 text-sm text-danger">
              {error instanceof ApiError ? error.message : t('loadError')}
            </div>
          )}

          {isLoading ? (
            <div className={view === 'grid' ? gridClass : 'flex flex-col gap-3'}>
              {Array.from({ length: view === 'grid' ? 8 : 4 }, (_, i) => (
                <Skeleton key={i} className={view === 'grid' ? 'h-64' : 'h-32'} />
              ))}
            </div>
          ) : courses.length === 0 && !hasNextPage ? (
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
          ) : (
            <div className={`transition-opacity duration-150 ease-soft ${refreshing ? 'pointer-events-none opacity-50' : 'opacity-100'}`}>
              {view === 'grid' ? (
                <div data-view="grid" className={gridClass}>
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
            </div>
          )}

          {/* Mốc ở cuối lưới: lọt vào khung nhìn thì tự tải thêm. Nút dự phòng + thông báo cho trình đọc màn hình. */}
          <div ref={sentinelRef} aria-hidden className="h-px" />
          {isFetchingNextPage && (
            <div className={`mt-5 ${view === 'grid' ? gridClass : 'flex flex-col gap-3'}`}>
              {Array.from({ length: view === 'grid' ? 4 : 2 }, (_, i) => (
                <Skeleton key={i} className={view === 'grid' ? 'h-64' : 'h-32'} />
              ))}
            </div>
          )}
          <p role="status" className="sr-only">
            {isFetchingNextPage ? t('loadMore.loading') : ''}
          </p>
          {hasNextPage && !isFetchingNextPage && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                className="btn-tactile min-h-10 rounded-full border border-line bg-surface-raised px-6 text-sm font-semibold text-accent-dark hover:border-accent"
              >
                {t('loadMore.button')}
              </button>
            </div>
          )}
          {!hasNextPage && courses.length > 0 && (
            <p className="mt-8 text-center text-sm text-ink-muted">{t('loadMore.end')}</p>
          )}
        </section>
      </div>
    </div>
  );
}
