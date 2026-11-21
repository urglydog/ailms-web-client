import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type PerformanceRange } from '@/lib/api/dashboard';
import { getAccessToken } from '@/lib/auth/token';

export function usePerformanceOverview(range: PerformanceRange) {
  return useQuery({
    queryKey: ['dashboard', 'instructor', 'performance', range],
    queryFn: () => dashboardApi.getPerformanceOverview(range),
    enabled: !!getAccessToken(),
  });
}

export function useRevenueList(range: PerformanceRange) {
  return useQuery({
    queryKey: ['dashboard', 'instructor', 'revenue', range],
    queryFn: () => dashboardApi.getRevenueList(range),
    enabled: !!getAccessToken(),
  });
}

export function useInstructorStudents(courseId?: number) {
  return useQuery({
    queryKey: ['dashboard', 'instructor', 'students', courseId ?? 'all'],
    queryFn: () => dashboardApi.getStudents(courseId),
    enabled: !!getAccessToken(),
  });
}

export function useInstructorStudentPage(p: { courseId?: number; atRiskOnly: boolean; q: string; page: number }) {
  return useQuery({
    queryKey: ['dashboard', 'instructor', 'students-page', p.courseId ?? 'all', p.atRiskOnly, p.q, p.page],
    queryFn: () => dashboardApi.searchStudents(p),
    enabled: !!getAccessToken(),
    placeholderData: (prev) => prev,
  });
}

export function useInstructorStudentSummary(courseId?: number) {
  return useQuery({
    queryKey: ['dashboard', 'instructor', 'students-summary', courseId ?? 'all'],
    queryFn: () => dashboardApi.getStudentSummary(courseId),
    enabled: !!getAccessToken(),
  });
}

export function useInstructorReviews(courseId?: number) {
  return useQuery({
    queryKey: ['dashboard', 'instructor', 'reviews', courseId ?? 'all'],
    queryFn: () => dashboardApi.getReviews(courseId),
    enabled: !!getAccessToken(),
  });
}

export function useInstructorCourseOptions() {
  return useQuery({
    queryKey: ['dashboard', 'instructor', 'my-courses'],
    queryFn: () => dashboardApi.getMyCoursesForFilter(),
    enabled: !!getAccessToken(),
  });
}

/** Sprint 3 mục 10 — chỉ fetch khi có đủ `from`/`to` (chọn xong cả 2 ngày). */
export function useRevenueSummary(from: string, to: string) {
  return useQuery({
    queryKey: ['dashboard', 'instructor', 'revenue-summary', from, to],
    queryFn: () => dashboardApi.getRevenueSummary(from, to),
    enabled: !!getAccessToken() && !!from && !!to,
  });
}

export function useHardQuestions() {
  return useQuery({
    queryKey: ['dashboard', 'instructor', 'hard-questions'],
    queryFn: () => dashboardApi.getHardQuestions(),
    enabled: !!getAccessToken(),
  });
}

export function useLessonRetention(lessonId: number | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'instructor', 'retention', lessonId],
    queryFn: () => dashboardApi.getLessonRetention(lessonId!),
    enabled: !!getAccessToken() && !!lessonId,
  });
}
