import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { CourseReview, CreateReviewInput, Page } from '@/types/domain';

interface RawReview {
  id: number;
  courseId: number;
  courseTitle: string;
  userName: string;
  userAvatarUrl: string | null;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  createdAt: string;
}

function toReview(raw: RawReview): CourseReview {
  return {
    id: raw.id,
    courseId: raw.courseId,
    courseTitle: raw.courseTitle,
    userName: raw.userName,
    userAvatarUrl: raw.userAvatarUrl,
    rating: raw.rating,
    comment: raw.comment,
    isHidden: raw.isHidden,
    createdAt: raw.createdAt,
  };
}

function authToken() {
  return getAccessToken() ?? undefined;
}

export const reviewsApi = {
  listForCourse: async (courseId: number, page = 0, size = 10): Promise<Page<CourseReview>> => {
    const raw = await api.get<Page<RawReview>>(
      `/api/v1/courses/${courseId}/reviews?page=${page}&size=${size}`,
    );
    return { ...raw, content: raw.content.map(toReview) };
  },

  create: async (courseId: number, input: CreateReviewInput): Promise<CourseReview> => {
    const raw = await api.post<RawReview>(`/api/v1/courses/${courseId}/reviews`, input, {
      token: authToken(),
    });
    return toReview(raw);
  },

  // ── Admin (UC44) ──
  listAll: async (page = 0, size = 20): Promise<Page<CourseReview>> => {
    const raw = await api.get<Page<RawReview>>(`/api/v1/reviews?page=${page}&size=${size}`, {
      token: authToken(),
    });
    return { ...raw, content: raw.content.map(toReview) };
  },

  hide: (id: number) => api.post<void>(`/api/v1/reviews/${id}/hide`, undefined, { token: authToken() }),

  unhide: (id: number) => api.post<void>(`/api/v1/reviews/${id}/unhide`, undefined, { token: authToken() }),
};
