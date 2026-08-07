import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type {
  CourseEditDetail,
  CourseStatus,
  CreateCourseInput,
  InstructorCourseSummary,
  Page,
  RejectCourseInput,
  UpdateCourseInput,
} from '@/types/domain';

function authToken() {
  return getAccessToken() ?? undefined;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const coursesApi = {
  create: (input: CreateCourseInput) =>
    api.post<CourseEditDetail>('/api/v1/courses', input, { token: authToken() }),

  listMine: (params: { status?: CourseStatus; page?: number; size?: number } = {}) =>
    api.get<Page<InstructorCourseSummary>>(
      `/api/v1/courses/mine${buildQuery(params)}`,
      { token: authToken() },
    ),

  getMineDetail: (id: number) =>
    api.get<CourseEditDetail>(`/api/v1/courses/mine/${id}`, { token: authToken() }),

  update: (id: number, input: UpdateCourseInput) =>
    api.put<CourseEditDetail>(`/api/v1/courses/mine/${id}`, input, { token: authToken() }),

  submit: (id: number) =>
    api.post<CourseEditDetail>(`/api/v1/courses/mine/${id}/submit`, undefined, { token: authToken() }),

  remove: (id: number) =>
    api.delete<void>(`/api/v1/courses/mine/${id}`, { token: authToken() }),

  listModeration: (params: { status?: CourseStatus; page?: number; size?: number } = {}) =>
    api.get<Page<InstructorCourseSummary>>(
      `/api/v1/courses/moderation${buildQuery(params)}`,
      { token: authToken() },
    ),

  getModerationDetail: (id: number) =>
    api.get<CourseEditDetail>(`/api/v1/courses/moderation/${id}`, { token: authToken() }),

  approve: (id: number) =>
    api.post<CourseEditDetail>(`/api/v1/courses/moderation/${id}/approve`, undefined, { token: authToken() }),

  reject: (id: number, input: RejectCourseInput) =>
    api.post<CourseEditDetail>(`/api/v1/courses/moderation/${id}/reject`, input, { token: authToken() }),
};
