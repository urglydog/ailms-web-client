'use client';

import { useQuery } from '@tanstack/react-query';
import { publicCoursesApi } from '@/lib/api/publicCourses';
import { StarRating } from '@/components/ui/StarRating';
import type { CourseSummary } from '@/types/domain';

const LEVEL_LABEL: Record<CourseSummary['level'], string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

/**
 * F-học liệu mở rộng (06/09/2026) — tab "Tổng quan" dưới video, tham khảo Udemy: mô tả khóa học +
 * thông tin giảng viên + số liệu (đánh giá, trình độ, số bài) ngay dưới video, không cần rời trang
 * bài học sang trang chi tiết khóa học mới xem được.
 *
 * Gọi lại NGUYÊN VẸN `publicCoursesApi.getBySlug` đã dùng ở trang chi tiết khóa học
 * (`app/(public)/courses/[slug]/page.tsx`) — không thêm field/endpoint mới ở be/, dữ liệu này vốn
 * đã công khai và không đổi theo từng bài học nên tận dụng lại được toàn bộ.
 */
export function CourseOverviewTab({ courseSlug }: { courseSlug: string }) {
  const { data: course, isLoading } = useQuery({
    queryKey: ['courses', 'public', courseSlug],
    queryFn: () => publicCoursesApi.getBySlug(courseSlug),
  });

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Đang tải...</p>;
  }

  if (!course) {
    return <p className="text-sm text-ink-muted">Không tải được thông tin khóa học.</p>;
  }

  const totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="mb-2 font-display text-lg font-bold text-ink">{course.title}</h2>
        <StarRating rating={course.avgRating} reviewCount={course.reviewCount} levelLabel={LEVEL_LABEL[course.level]} />
      </div>

      <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink-muted">{course.description}</p>

      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line-soft pt-4 text-sm text-ink-muted">
        <span>📚 {course.chapters.length} chương · {totalLessons} bài giảng</span>
        <span>🌐 Có thể lồng tiếng sang {course.langs.length} ngôn ngữ</span>
      </div>

      <div className="flex items-center gap-3 border-t border-line-soft pt-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 font-display text-base font-bold text-accent">
          {course.instructorName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Giảng viên</p>
          <p className="text-sm font-semibold text-ink">{course.instructorName}</p>
        </div>
      </div>
    </div>
  );
}
