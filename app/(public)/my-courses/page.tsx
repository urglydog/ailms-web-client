'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { ApiError } from '@/lib/api/client';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { getCurrentRole } from '@/lib/auth/token';
import { MyLearningTabs } from '@/components/course/MyLearningTabs';
import type { EnrolledCourse } from '@/types/domain';

type ProgressFilter = 'all' | 'not-started' | 'in-progress' | 'completed';
type SortOption = 'recently-accessed' | 'recently-enrolled' | 'title-asc' | 'title-desc';

const PROGRESS_OPTIONS: Array<{ value: ProgressFilter; label: string }> = [
  { value: 'all', label: 'Tất cả tiến độ' },
  { value: 'not-started', label: 'Chưa bắt đầu' },
  { value: 'in-progress', label: 'Đang học' },
  { value: 'completed', label: 'Đã hoàn thành' },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'recently-accessed', label: 'Truy cập gần đây' },
  { value: 'recently-enrolled', label: 'Ghi danh gần đây' },
  { value: 'title-asc', label: 'Tên: A đến Z' },
  { value: 'title-desc', label: 'Tên: Z đến A' },
];

function progressBucket(course: EnrolledCourse): Exclude<ProgressFilter, 'all'> {
  if (course.progressPct >= 100) return 'completed';
  if (course.progressPct <= 0) return 'not-started';
  return 'in-progress';
}

/**
 * "Khóa học của tôi" — trước đây là link chết ở menu tài khoản (`Header.tsx`). Chỉ đọc
 * (`GET /api/v1/enrollments/mine`) — chưa có luồng ghi danh/mua khóa thật (Giai đoạn 3),
 * nhưng cần có để Student biết mình đã sở hữu khóa nào mà vào đánh giá (UC23).
 *
 * Giao diện kiểu Udemy "My learning" (14/09/2026): tìm kiếm + lọc theo tiến độ/giảng viên
 * + sắp xếp. `listMine()` không phân trang (danh sách khóa 1 học viên sở hữu luôn nhỏ) nên
 * mọi tương tác này làm THUẦN PHÍA CLIENT trên list đã tải sẵn — không cần thêm query param
 * nào ở BE, chỉ cần BE trả thêm field (instructorName/myRating/enrolledAt/lastAccessedAt).
 *
 * Tìm kiếm cố ý CHỈ chạy khi bấm Enter/icon (giống `Header.tsx`), không lọc theo từng phím
 * gõ — vì đây là lọc local nên "gõ liên tục có lag" không áp dụng y hệt lý do gốc (gọi API),
 * nhưng vẫn giữ đúng hành vi UI người dùng yêu cầu để nhất quán trải nghiệm toàn site.
 */
export default function MyCoursesPage() {
  const router = useRouter();
  const { data, isLoading, error } = useMyEnrollments();

  useEffect(() => {
    if (!getCurrentRole()) {
      router.replace('/login');
    }
  }, [router]);

  const courses = useMemo(() => data ?? [], [data]);

  const instructors = useMemo(
    () => Array.from(new Set(courses.map((c) => c.instructorName))).sort((a, b) => a.localeCompare(b)),
    [courses],
  );

  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('all');
  const [instructorFilter, setInstructorFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('recently-enrolled');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const submitSearch = () => setSearchQuery(searchInput.trim());
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitSearch();
  };

  const visibleCourses = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase();
    const filtered = courses.filter((course) => {
      if (progressFilter !== 'all' && progressBucket(course) !== progressFilter) return false;
      if (instructorFilter !== 'all' && course.instructorName !== instructorFilter) return false;
      if (normalizedQuery && !course.courseTitle.toLowerCase().includes(normalizedQuery)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'recently-accessed': {
          const aTime = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
          const bTime = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
          return bTime - aTime;
        }
        case 'recently-enrolled':
          return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
        case 'title-asc':
          return a.courseTitle.localeCompare(b.courseTitle);
        case 'title-desc':
          return b.courseTitle.localeCompare(a.courseTitle);
        default:
          return 0;
      }
    });
  }, [courses, progressFilter, instructorFilter, searchQuery, sortBy]);

  return (
    <div>
      <div className="bg-ink">
        <div className="shell py-8">
          <MyLearningTabs active="courses" />
        </div>
      </div>

      <div className="shell py-10">
      {error && (
        <div className="card mb-4 p-4 text-sm text-red-600">
          {error instanceof ApiError ? error.message : 'Không tải được danh sách khóa học.'}
        </div>
      )}

      {isLoading && <p className="text-sm text-ink-muted">Đang tải…</p>}

      {!isLoading && courses.length === 0 && !error && (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="text-3xl" aria-hidden>
            📚
          </span>
          <span className="font-display text-lg font-semibold text-ink">
            Bạn chưa sở hữu khóa học nào
          </span>
          <Link
            href="/courses"
            className="mt-1 text-sm font-semibold text-accent underline-offset-4 hover:underline"
          >
            Khám phá khóa học
          </Link>
        </div>
      )}

      {!isLoading && courses.length > 0 && (
        <>
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Bộ lọc bên trái, tìm kiếm + sắp xếp bên phải — đúng vị trí trang "My learning" của Udemy. */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={progressFilter}
                onChange={(e) => setProgressFilter(e.target.value as ProgressFilter)}
                className="rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm
                           text-ink focus:border-accent focus:outline-none"
              >
                {PROGRESS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={instructorFilter}
                onChange={(e) => setInstructorFilter(e.target.value)}
                className="rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm
                           text-ink focus:border-accent focus:outline-none"
              >
                <option value="all">Tất cả giảng viên</option>
                {instructors.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-end gap-3">
              {/* Ô tìm kiếm + nút icon gắn liền kiểu Udemy (khung vuông màu accent, không lơ
                  lửng icon bên trong input) — bấm nút hoặc Enter đều tìm, không lọc theo từng
                  ký tự gõ. */}
              <div className="flex w-full max-w-xs">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Tìm theo tên khóa học…"
                  className="w-full rounded-l-lg border border-r-0 border-line bg-surface-raised px-3 py-2 text-sm
                             text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={submitSearch}
                  aria-label="Tìm kiếm"
                  className="flex shrink-0 items-center justify-center rounded-r-lg border border-accent bg-accent px-3.5 text-white hover:bg-accent-dark"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
              </div>

              <label className="flex items-center gap-2 text-sm text-ink-muted">
                Sắp xếp:
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm
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
          </div>

          {visibleCourses.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="text-3xl" aria-hidden>
                🔍
              </span>
              <span className="font-display text-lg font-semibold text-ink">
                Không tìm thấy khóa học phù hợp
              </span>
              <p className="max-w-sm text-sm text-ink-muted">Thử đổi từ khóa hoặc bỏ bớt bộ lọc.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleCourses.map((course) => (
                <MyCourseCard key={course.courseId} course={course} />
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

function MyCourseCard({ course }: { course: EnrolledCourse }) {
  const progress = Math.min(100, Math.max(0, course.progressPct));

  return (
    <Link
      // Đã sở hữu khoá này rồi — bấm vào thẳng bài học (không phải trang chi tiết để mua
      // lại). Fallback trang chi tiết chỉ xảy ra khi khoá chưa có bài học nào.
      href={course.firstLessonId != null ? `/learn/${course.firstLessonId}` : `/courses/${course.courseSlug}`}
      className="card-interactive flex flex-col overflow-hidden no-underline hover:no-underline"
    >
      <div className="relative aspect-video overflow-hidden bg-surface">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.courseTitle}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="rounded-full bg-ink/35 px-2.5 py-1 font-mono text-[11px] tracking-wide text-white/85">
              ảnh bìa khoá học
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="line-clamp-2 min-h-[38px] font-display text-sm font-semibold leading-snug text-ink">
          {course.courseTitle}
        </span>
        <span className="text-xs text-ink-muted">GV. {course.instructorName}</span>

        {/* UC22 — % tiến độ khóa học (BR-PROGRESS-02) */}
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/50">
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[11px] font-semibold text-ink-muted">{Math.round(progress)}%</span>
        </div>

        {/* Số sao học viên TỰ chấm cho khóa — để trống (sao rỗng) nếu chưa đánh giá. */}
        <div className="flex items-center gap-0.5 pt-1" aria-label="Đánh giá của bạn cho khóa này">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={course.myRating != null && star <= course.myRating ? 'text-star' : 'text-line'}
              aria-hidden
            >
              ★
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
