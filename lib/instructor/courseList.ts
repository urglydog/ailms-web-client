import type { CourseStatus, InstructorCourseSummary } from '@/types/domain';

export type StatusFilter = CourseStatus | 'ALL';
export type CourseSort = 'newest' | 'oldest' | 'az' | 'za';
export type NextAction = 'complete' | 'submit' | 'fixRejected' | 'reactivate' | 'waiting' | 'live';

export type StatusCounts = Record<StatusFilter, number> & {
  /** Khóa cần giảng viên xử lý: nháp và bị từ chối. */
  attention: number;
};

export function countByStatus(courses: InstructorCourseSummary[]): StatusCounts {
  const counts: StatusCounts = { ALL: courses.length, DRAFT: 0, PENDING: 0, PUBLISHED: 0, REJECTED: 0, ARCHIVED: 0, attention: 0 };
  for (const c of courses) counts[c.status] += 1;
  counts.attention = counts.DRAFT + counts.REJECTED;
  return counts;
}

export interface CourseListQuery {
  status: StatusFilter;
  query: string;
  sort: CourseSort;
}

/** Lọc theo trạng thái và từ khóa (không phân biệt hoa thường) rồi sắp xếp; không đổi mảng gốc. */
export function filterAndSortCourses(courses: InstructorCourseSummary[], { status, query, sort }: CourseListQuery): InstructorCourseSummary[] {
  const needle = query.trim().toLowerCase();
  const filtered = courses.filter(
    (c) => (status === 'ALL' || c.status === status) && (needle === '' || c.title.toLowerCase().includes(needle)),
  );
  switch (sort) {
    case 'newest':
      return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'oldest':
      return filtered.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case 'az':
      return filtered.sort((a, b) => a.title.localeCompare(b.title));
    case 'za':
      return filtered.sort((a, b) => b.title.localeCompare(a.title));
  }
}

/** Việc nên làm tiếp với một khóa, để hiện ngay ở danh sách. */
export function nextAction(course: InstructorCourseSummary): NextAction {
  switch (course.status) {
    case 'DRAFT':
      return course.completionPercent >= 100 ? 'submit' : 'complete';
    case 'REJECTED':
      return 'fixRejected';
    case 'ARCHIVED':
      return 'reactivate';
    case 'PENDING':
      return 'waiting';
    case 'PUBLISHED':
      return 'live';
  }
}
