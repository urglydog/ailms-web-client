import { api, uploadFile } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type {
  CourseEditDetail,
  CourseStatus,
  CourseVisibility,
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

  /** Giai đoạn 4 — upload ảnh bìa thật lên B2, thay ô nhập URL text tạm thời của F2.1. */
  uploadThumbnail: (id: number, file: File, onProgress?: (percent: number) => void) =>
    uploadFile<CourseEditDetail>(`/api/v1/courses/mine/${id}/thumbnail`, file, {
      token: authToken(),
      onProgress,
    }),

  submit: (id: number) =>
    api.post<CourseEditDetail>(`/api/v1/courses/mine/${id}/submit`, undefined, { token: authToken() }),

  remove: (id: number) =>
    api.delete<void>(`/api/v1/courses/mine/${id}`, { token: authToken() }),

  /** "Kích hoạt lại" (19/09/2026, tính năng mới) — khôi phục khóa đang ở trạng thái lưu trữ. */
  reactivate: (id: number) =>
    api.post<CourseEditDetail>(`/api/v1/courses/mine/${id}/reactivate`, undefined, { token: authToken() }),

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

  /** "Đăng ký (Quyền riêng tư)" kiểu Udemy (19/09/2026) — Cài đặt khóa học. */
  updateVisibility: (id: number, input: { visibility: CourseVisibility; password?: string | null }) =>
    api.put<CourseEditDetail>(`/api/v1/courses/mine/${id}/visibility`, input, { token: authToken() }),

  listInvites: (id: number) =>
    api.get<string[]>(`/api/v1/courses/mine/${id}/invites`, { token: authToken() }),

  addInvite: (id: number, email: string) =>
    api.post<void>(`/api/v1/courses/mine/${id}/invites`, { email }, { token: authToken() }),

  removeInvite: (id: number, email: string) =>
    api.delete<void>(`/api/v1/courses/mine/${id}/invites/${encodeURIComponent(email)}`, { token: authToken() }),

  getActivities: (id: number, limit = 50) =>
    api.get<CourseActivityItem[]>(`/api/v1/courses/mine/${id}/activities?limit=${limit}`, { token: authToken() }),
};

export interface CourseActivityItem {
  id: number;
  actorName: string | null;
  description: string;
  createdAt: string;
}
