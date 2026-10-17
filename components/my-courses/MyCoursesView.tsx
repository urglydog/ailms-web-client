'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { useReveal } from '@/hooks/useReveal';
import { useStreak } from '@/hooks/useStreak';
import { ApiError } from '@/lib/api/client';
import {
  countByStatus,
  filterAndSort,
  pickCompleted,
  pickContinue,
  resolveViewMode,
} from '@/lib/myCourses/model';
import type { SortOption, StatusFilter, ViewMode } from '@/lib/myCourses/model';
import { ContinueHero } from './ContinueHero';
import { CourseRow } from './CourseRow';
import { CourseTile } from './CourseTile';
import { ListToolbar } from './ListToolbar';
import { NextSuggestions } from './NextSuggestions';
import { StatsRow } from './StatsRow';

/** Khóa lưu dạng xem (danh sách/thẻ) trên trình duyệt. */
const VIEW_KEY = 'my-courses-view';

/** Nội dung trang "Khóa học của tôi" (spec mục 6): thống kê, khối Tiếp tục học, thanh lọc, danh sách hoặc thẻ,
 * cùng các trạng thái trống/không tìm thấy/đã học xong hết. Lọc và sắp xếp làm hoàn toàn phía client trên danh
 * sách đã tải (danh sách khóa của một học viên luôn nhỏ, không phân trang). */
export function MyCoursesView() {
  const t = useTranslations('myCourses');
  const { data, isLoading, error } = useMyEnrollments();
  const { data: streak } = useStreak();
  const { data: currentUser } = useCurrentUser();

  const courses = useMemo(() => data ?? [], [data]);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOption>('recently-accessed');
  const [query, setQuery] = useState('');
  // Đọc lựa chọn đã lưu trong effect (không đọc lúc khởi tạo) để HTML server và client khớp nhau.
  const [storedView, setStoredView] = useState<string | null>(null);
  const [itemsRef, shown] = useReveal<HTMLDivElement>();
  // Máy chủ không có token nên truy vấn bị tắt (không tải, data rỗng) còn trình duyệt thì đang tải; nếu cả hai
  // vẽ theo `isLoading` ngay lần đầu, HTML lệch nhau (lỗi hydration). Chỉ quyết định hiển thị sau khi đã gắn kết.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setStoredView(localStorage.getItem(VIEW_KEY));
    } catch {
      // Trình duyệt chặn lưu trữ: dùng mặc định theo số khóa.
    }
  }, []);

  const view: ViewMode = resolveViewMode(storedView, courses.length);
  const changeView = (next: ViewMode) => {
    setStoredView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Không lưu được thì chỉ mất ghi nhớ, giao diện vẫn đổi.
    }
  };

  const counts = useMemo(() => countByStatus(courses), [courses]);
  const visible = useMemo(() => filterAndSort(courses, { status, query, sort }), [courses, status, query, sort]);
  const featured = pickContinue(courses) ?? pickCompleted(courses);
  const hasInProgress = pickContinue(courses) !== null;
  const ownedIds = useMemo(() => new Set(courses.map((c) => c.courseId)), [courses]);
  const profileHref = currentUser?.id != null ? `/u/${currentUser.id}?tab=certificates` : null;
  const certificates = courses.filter((c) => c.certificateCode).length;

  if (mounted && error) {
    return (
      <div className="shell py-8">
        <div className="rounded-card border border-line bg-surface-raised p-4 text-sm text-danger">
          {error instanceof ApiError ? error.message : t('error')}
        </div>
      </div>
    );
  }

  if (!mounted || isLoading) {
    return (
      <div className="shell py-8">
        <p className="text-sm text-ink-muted">{t('loading')}</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="shell py-8">
        <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-line bg-surface-raised px-6 py-14 text-center">
          <GraduationCap size={34} aria-hidden className="text-accent" />
          <h2 className="m-0 font-display text-lg font-semibold text-ink">{t('empty.title')}</h2>
          <p className="m-0 max-w-sm text-sm text-ink-muted">{t('empty.body')}</p>
          <Link
            href="/courses"
            className="btn-tactile mt-1 inline-flex items-center rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
          >
            {t('empty.cta')}
          </Link>
        </div>
        <NextSuggestions ownedIds={ownedIds} titleKey="trending" />
      </div>
    );
  }

  const Item = view === 'grid' ? CourseTile : CourseRow;

  return (
    <div className="shell py-8">
      <p className="mb-3 mt-0 text-right text-xs text-ink-muted">{t('count', { count: courses.length })}</p>

      <StatsRow streak={streak?.currentStreak ?? 0} inProgress={counts['in-progress']} certificates={certificates} />

      {featured && (
        <div className="mb-5">
          <ContinueHero course={featured} profileHref={profileHref} />
        </div>
      )}

      <ListToolbar
        status={status}
        counts={counts}
        onStatusChange={setStatus}
        sort={sort}
        onSortChange={setSort}
        view={view}
        onViewChange={changeView}
        onSearch={setQuery}
      />

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-panel border border-dashed border-line bg-surface-raised px-6 py-12 text-center">
          <h2 className="m-0 font-display text-base font-semibold text-ink">{t('noResults.title')}</h2>
          <p className="m-0 text-sm text-ink-muted">{t('noResults.body')}</p>
        </div>
      ) : (
        <div
          ref={itemsRef}
          data-testid="course-items"
          data-view={view}
          className={view === 'grid' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-2'}
        >
          {visible.map((course, i) => (
            <div
              key={course.courseId}
              className={`reveal ${shown ? 'is-in' : ''}`}
              style={{ '--i': Math.min(i, 8) } as CSSProperties}
            >
              <Item course={course} />
            </div>
          ))}
        </div>
      )}

      {!hasInProgress && <NextSuggestions ownedIds={ownedIds} titleKey="title" />}
    </div>
  );
}
