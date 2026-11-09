import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { EnrolledCourse } from '@/types/domain';

export const enrollmentsApi = {
  listMine: () =>
    api.get<EnrolledCourse[]>('/api/v1/enrollments/mine', { token: getAccessToken() ?? undefined }),
  /** "Đăng ký (Quyền riêng tư)" kiểu Udemy (19/09/2026) — `password` chỉ cần khi khóa học ở
   * chế độ PRIVATE_PASSWORD, bỏ qua với mọi khóa khác. */
  enrollFree: (courseId: number, password?: string) =>
    api.post<void>(
      `/api/v1/enrollments/free/${courseId}${password ? `?password=${encodeURIComponent(password)}` : ''}`,
      undefined,
      { token: getAccessToken() ?? undefined },
    ),
};
