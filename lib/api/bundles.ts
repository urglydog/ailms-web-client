import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { CourseBundle, CreateBundleReq, UpdateBundleReq } from '@/types/domain';

/** API cho Course Bundles (29/09/2026 — Sprint 1 Bundles & Upsells). */
export const bundlesApi = {
  /** Lấy danh sách gói của Giảng viên (phân trang — trả về content/totalPages). */
  listMine: (page = 0) =>
    api.get<{ content: CourseBundle[]; totalPages: number; totalElements: number }>(
      `/api/v1/instructor/bundles?page=${page}&size=10&sort=createdAt,desc`,
      { token: getAccessToken() ?? undefined },
    ),

  create: (req: CreateBundleReq) =>
    api.post<CourseBundle>('/api/v1/instructor/bundles', req, { token: getAccessToken() ?? undefined }),

  update: (id: number, req: UpdateBundleReq) =>
    api.put<CourseBundle>(`/api/v1/instructor/bundles/${id}`, req, { token: getAccessToken() ?? undefined }),

  /** Lấy danh sách gói có chứa khóa học này (Public — dùng ở trang chi tiết). */
  getForCourse: (courseId: number) =>
    api.get<CourseBundle[]>(`/api/v1/courses/${courseId}/bundles`),

  /** Gộp tra bundle cho nhiều courseId trong 1 request (Public — dùng ở giỏ hàng, tránh bắn
   * N request song song khi giỏ có nhiều khóa). */
  getForCourses: (courseIds: number[]) =>
    api.get<CourseBundle[]>(`/api/v1/courses/bundles/active?courseIds=${courseIds.join(',')}`),
};
