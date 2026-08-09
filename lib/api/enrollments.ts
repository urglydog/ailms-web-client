import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { EnrolledCourse } from '@/types/domain';

export const enrollmentsApi = {
  listMine: () =>
    api.get<EnrolledCourse[]>('/api/v1/enrollments/mine', { token: getAccessToken() ?? undefined }),
  enrollFree: (courseId: number) =>
    api.post<void>(`/api/v1/enrollments/free/${courseId}`, undefined, { token: getAccessToken() ?? undefined }),
};
