'use client';

import { CourseCard } from '@/components/course/CourseCard';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import type { CourseSummary } from '@/types/domain';

/**
 * Lưới "Khóa học nổi bật" ở trang chủ (06/09/2026) — khóa học học viên ĐÃ SỞ HỮU không còn
 * hiển thị ở đây nữa (theo yêu cầu: trang chủ/trang khóa học chỉ nên gợi ý khóa CHƯA mua).
 *
 * Tách thành Client Component riêng vì trang chủ (`app/(public)/page.tsx`) là Server
 * Component (fetch danh sách khóa lúc render server, tránh gọi API 2 lần) — nhưng việc biết
 * "học viên đã sở hữu khóa nào" chỉ có được ở phía client (`useMyEnrollments` đọc JWT từ
 * `localStorage`, Server Component không đọc được). Khách chưa đăng nhập
 * (`useMyEnrollments` không chạy, `enrollments` là `undefined`) thì không lọc gì cả — coi như
 * chưa sở hữu khóa nào, đúng thực tế.
 */
export function FeaturedCourseGrid({ courses }: { courses: CourseSummary[] }) {
  const { data: enrollments } = useMyEnrollments();
  const visibleCourses = enrollments
    ? courses.filter((course) => !enrollments.some((e) => e.courseId === course.id))
    : courses;

  return (
    <div className="grid gap-[22px] md:grid-cols-2 lg:grid-cols-3">
      {visibleCourses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
