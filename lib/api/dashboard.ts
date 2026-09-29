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
  /** Chia doanh thu 2 mức (20/09/2026) — ORGANIC (37%) hoặc INSTRUCTOR_REFERRAL (97%, mua qua
   * liên kết giới thiệu riêng của Giảng viên). */
  revenueSource: 'ORGANIC' | 'INSTRUCTOR_REFERRAL';
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

/** Sprint 3 mục 10 (29/09/2026, mở rộng) — Báo cáo doanh thu gộp/phí nền tảng/thực nhận theo
 * khoảng ngày tự chọn (khác {@link PerformanceOverview}, vốn chỉ hỗ trợ preset 7d/30d/12m/all). */
export interface RevenueSummary {
  grossRevenue: number;
  platformFee: number;
  netRevenue: number;
  transactionCount: number;
}

/** Sprint 3 mục 10 — 1 câu hỏi quiz có tỷ lệ trả lời sai > 60% (đã lọc ngưỡng mẫu tối thiểu ở BE). */
export interface HardQuestionRow {
  questionId: number;
  content: string;
  courseTitle: string;
  lessonTitle: string | null;
  totalAnswers: number;
  wrongRatePercent: number;
}

/** Sprint 3 mục 10 — 1 điểm trên biểu đồ Retention Heatmap: đã xem tới decile (1..10, ứng
 * 10%/.../100% thời lượng) thì còn lại bao nhiêu % học viên. */
export interface RetentionPoint {
  decile: number;
  retainedPercent: number;
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

  /** `from`/`to` dạng `YYYY-MM-DD` (khớp `LocalDate` ở BE). */
  getRevenueSummary: (from: string, to: string) =>
    api.get<RevenueSummary>(
      `/api/v1/dashboard/instructor/revenue/summary?from=${from}&to=${to}`,
      { token: authToken() },
    ),

  getHardQuestions: () =>
    api.get<HardQuestionRow[]>('/api/v1/dashboard/instructor/hard-questions', { token: authToken() }),

  getLessonRetention: (lessonId: number) =>
    api.get<RetentionPoint[]>(`/api/v1/dashboard/instructor/retention/${lessonId}`, { token: authToken() }),
};
