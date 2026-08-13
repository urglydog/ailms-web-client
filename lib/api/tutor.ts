import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { TutorAskReq, TutorAskRes } from '@/types/domain';

export const tutorApi = {
  /** UC30 — hỏi Gia sư AI Socratic, HTTP đồng bộ (không qua WebSocket). */
  ask: (lessonId: number, req: TutorAskReq) =>
    api.post<TutorAskRes>(`/api/v1/lessons/${lessonId}/tutor/ask`, req, {
      token: getAccessToken() ?? undefined,
    }),
};
