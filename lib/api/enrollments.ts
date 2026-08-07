import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { EnrolledCourse } from '@/types/domain';

export const enrollmentsApi = {
  listMine: () =>
    api.get<EnrolledCourse[]>('/api/v1/enrollments/mine', { token: getAccessToken() ?? undefined }),
};
