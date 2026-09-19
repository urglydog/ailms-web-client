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
