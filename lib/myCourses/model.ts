import type { EnrolledCourse } from '@/types/domain';

/** Trạng thái hiển thị: khóa chưa bắt đầu (0%) vẫn tính là "đang học" (spec mục 6, bỏ bộ lọc "Chưa bắt đầu"). */
export type CourseStatus = 'in-progress' | 'completed';
export type StatusFilter = 'all' | CourseStatus;
export type SortOption = 'recently-accessed' | 'recently-enrolled' | 'title-asc' | 'title-desc';
export type ViewMode = 'list' | 'grid';

export function statusOf(course: EnrolledCourse): CourseStatus {
  return course.progressPct >= 100 ? 'completed' : 'in-progress';
}

export function countByStatus(courses: EnrolledCourse[]): Record<StatusFilter, number> {
  const completed = courses.filter((c) => statusOf(c) === 'completed').length;
  return { all: courses.length, 'in-progress': courses.length - completed, completed };
}

function time(value: string | null): number {
  return value ? new Date(value).getTime() : 0;
}

export interface ListQuery {
  status: StatusFilter;
  query: string;
  sort: SortOption;
}

/** Lọc theo trạng thái và từ khóa (tên khóa, không phân biệt hoa thường) rồi sắp xếp. Không đổi mảng gốc. */
export function filterAndSort(courses: EnrolledCourse[], { status, query, sort }: ListQuery): EnrolledCourse[] {
  const needle = query.trim().toLowerCase();
  const filtered = courses.filter((c) => {
    if (status !== 'all' && statusOf(c) !== status) return false;
    if (needle && !c.courseTitle.toLowerCase().includes(needle)) return false;
    return true;
  });
  return [...filtered].sort((a, b) => {
    switch (sort) {
      case 'recently-accessed':
        return time(b.lastAccessedAt) - time(a.lastAccessedAt);
      case 'recently-enrolled':
        return time(b.enrolledAt) - time(a.enrolledAt);
      case 'title-asc':
        return a.courseTitle.localeCompare(b.courseTitle);
      case 'title-desc':
        return b.courseTitle.localeCompare(a.courseTitle);
    }
  });
}

/** Khóa đang học để hiện ở khối "Tiếp tục học": truy cập gần nhất; chưa học bài nào thì theo ngày ghi danh. */
export function pickContinue(courses: EnrolledCourse[]): EnrolledCourse | null {
  const inProgress = courses.filter((c) => statusOf(c) === 'in-progress');
  if (inProgress.length === 0) return null;
  const touched = (c: EnrolledCourse) => time(c.lastAccessedAt) || time(c.enrolledAt);
  return [...inProgress].sort((a, b) => touched(b) - touched(a))[0] ?? null;
}

/** Khóa hoàn thành gần nhất, cho khối chúc mừng khi không còn khóa đang học. */
export function pickCompleted(courses: EnrolledCourse[]): EnrolledCourse | null {
  const done = courses.filter((c) => statusOf(c) === 'completed');
  if (done.length === 0) return null;
  return [...done].sort((a, b) => time(b.completedAt) - time(a.completedAt))[0] ?? null;
}

/** Đích của nút "Học tiếp"/bấm thẻ: bài đang học dở; lùi về bài đầu nếu backend chưa trả; hết cách thì trang chi tiết. */
export function learnHref(course: EnrolledCourse): string {
  const lessonId = course.resumeLessonId ?? course.firstLessonId;
  return lessonId != null ? `/learn/${lessonId}` : `/courses/${course.courseSlug}`;
}

export function certificateHref(course: EnrolledCourse): string | null {
  return course.certificateCode ? `/certificates/${course.certificateCode}` : null;
}

/** Dạng xem: dùng lựa chọn đã lưu nếu hợp lệ; chưa có thì mặc định dạng thẻ. */
export function resolveViewMode(stored: string | null): ViewMode {
  if (stored === 'list' || stored === 'grid') return stored;
  return 'grid';
}
