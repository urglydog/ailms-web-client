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
  moderationReason: string | null;
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
    moderationReason: raw.moderationReason,
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
  listAll: async (
    page = 0,
    size = 20,
    courseTitle?: string,
    instructorEmail?: string,
    status?: string
  ): Promise<Page<CourseReview>> => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', size.toString());
    if (courseTitle) params.set('courseTitle', courseTitle);
    if (instructorEmail) params.set('instructorEmail', instructorEmail);
    if (status && status !== 'ALL') params.set('status', status);

    const raw = await api.get<Page<RawReview>>(`/api/v1/reviews?${params.toString()}`, {
      token: authToken(),
    });
    return { ...raw, content: raw.content.map(toReview) };
  },

  hide: (id: number) => api.post<void>(`/api/v1/reviews/${id}/hide`, undefined, { token: authToken() }),

  unhide: (id: number) => api.post<void>(`/api/v1/reviews/${id}/unhide`, undefined, { token: authToken() }),
};
