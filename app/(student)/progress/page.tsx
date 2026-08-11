'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { ApiError } from '@/lib/api/client';
import { getCurrentRole } from '@/lib/auth/token';

/**
 * UC22 — Báo cáo tiến độ cá nhân. Tái dùng {@link useMyEnrollments} (Giai đoạn 3) — endpoint
 * `/api/v1/enrollments/mine` giờ trả kèm `progressPct`/`completedAt`/`quizScore` (F6.2), không
 * cần endpoint báo cáo riêng.
 */
export default function ProgressPage() {
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
      <h1 className="mb-2 font-display text-3xl font-bold text-ink">Báo cáo tiến độ</h1>
      <p className="mb-8 text-sm text-ink-muted">Tiến độ học tập của bạn trên từng khóa học.</p>

      {error && (
        <div className="card mb-4 p-4 text-sm text-red-600">
          {error instanceof ApiError ? error.message : 'Không tải được báo cáo tiến độ.'}
        </div>
      )}

      {isLoading && <p className="text-sm text-ink-muted">Đang tải…</p>}

      {!isLoading && courses.length === 0 && !error && (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="text-3xl" aria-hidden>
            📊
          </span>
          <span className="font-display text-lg font-semibold text-ink">
            Chưa có khóa học nào để báo cáo
          </span>
          <Link
            href="/courses"
            className="mt-1 text-sm font-semibold text-accent underline-offset-4 hover:underline"
          >
            Khám phá khóa học
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {courses.map((course) => (
          <Link
            key={course.courseId}
            href={`/courses/${course.courseSlug}`}
            className="card-interactive flex flex-col gap-3 p-4 no-underline hover:no-underline sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <span className="block text-[11px] font-semibold text-ink-faint">{course.categoryName}</span>
              <span className="block font-display text-base font-semibold text-ink">{course.courseTitle}</span>
              {course.completedAt && (
                <span className="mt-1 block text-[11px] font-semibold text-green-600">
                  Hoàn thành lúc {new Date(course.completedAt).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 sm:w-56">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-line/50">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(100, Math.max(0, course.progressPct))}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-sm font-bold text-ink">
                {Math.round(course.progressPct)}%
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
