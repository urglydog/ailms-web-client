import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

function authToken() {
  return getAccessToken() ?? undefined;
}

export type PerformanceRange = '7d' | '30d' | '12m' | 'all';

export interface PerformanceOverview {
  revenue: number;
  enrollments: number;
  avgRating: number;
}

export interface RevenueRow {
  courseTitle: string;
  amount: number;
  instructorEarning: number;
  paidAt: string;
  couponCode: string | null;
}

export interface StudentRow {
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseId: number;
  courseTitle: string;
  enrolledAt: string;
  progressPct: number;
}

export interface ReviewRow {
  studentName: string;
  courseId: number;
  courseTitle: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface InstructorCourseOption {
  id: number;
  title: string;
}

/** Trang "Hiệu suất" Giảng viên (19/09/2026, mở rộng — giao diện tham khảo Udemy). */
export const dashboardApi = {
  getPerformanceOverview: (range: PerformanceRange) =>
    api.get<PerformanceOverview>(`/api/v1/dashboard/instructor/performance?range=${range}`, { token: authToken() }),

  getRevenueList: (range: PerformanceRange) =>
    api.get<RevenueRow[]>(`/api/v1/dashboard/instructor/revenue?range=${range}`, { token: authToken() }),

  getStudents: (courseId?: number) =>
    api.get<StudentRow[]>(
      `/api/v1/dashboard/instructor/students${courseId ? `?courseId=${courseId}` : ''}`,
      { token: authToken() },
    ),

  getReviews: (courseId?: number) =>
    api.get<ReviewRow[]>(
      `/api/v1/dashboard/instructor/reviews${courseId ? `?courseId=${courseId}` : ''}`,
      { token: authToken() },
    ),

  getMyCoursesForFilter: () =>
    api.get<InstructorCourseOption[]>('/api/v1/dashboard/instructor/my-courses', { token: authToken() }),
};
