'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ApiError } from '@/lib/api/client';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { getCurrentRole } from '@/lib/auth/token';

/**
 * "Khóa học của tôi" — trước đây là link chết ở menu tài khoản (`Header.tsx`). Chỉ đọc
 * (`GET /api/v1/enrollments/mine`) — chưa có luồng ghi danh/mua khóa thật (Giai đoạn 3),
 * nhưng cần có để Student biết mình đã sở hữu khóa nào mà vào đánh giá (UC23).
 */
export default function MyCoursesPage() {
  const router = useRouter();
  const { data, isLoading, error } = useMyEnrollments();

  useEffect(() => {
    if (!getCurrentRole()) {
      router.replace('/login');
    }
  }, [router]);

  const courses = data ?? [];

  return (
    <div className="shell py-10">
      <h1 className="mb-2 font-display text-3xl font-bold text-ink">Khóa học của tôi</h1>
      <p className="mb-8 text-sm text-ink-muted">Các khóa học bạn đã sở hữu.</p>

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

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Link
            key={course.courseId}
            // Đã sở hữu khoá này rồi — bấm vào thẳng bài học (không phải trang chi tiết để mua
            // lại). Fallback trang chi tiết chỉ xảy ra khi khoá chưa có bài học nào.
            href={course.firstLessonId != null ? `/learn/${course.firstLessonId}` : `/courses/${course.courseSlug}`}
            className="card-interactive flex flex-col gap-2 p-4 no-underline hover:no-underline"
          >
            <span className="text-[11px] font-semibold text-ink-faint">{course.categoryName}</span>
            <span className="font-display text-base font-semibold text-ink">{course.courseTitle}</span>

            {/* UC22 — % tiến độ khóa học (BR-PROGRESS-02) */}
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/50">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(100, Math.max(0, course.progressPct))}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-ink-muted">
                {Math.round(course.progressPct)}%
              </span>
            </div>

            <span
              className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${
                course.alreadyReviewed ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {course.alreadyReviewed ? 'Đã đánh giá' : 'Chưa đánh giá'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
