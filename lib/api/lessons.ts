import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { CreateLessonInput, LessonEditItem, ReorderInput, UpdateLessonInput } from '@/types/domain';

function authToken() {
  return getAccessToken() ?? undefined;
}

export const lessonsApi = {
  create: (chapterId: number, input: CreateLessonInput) =>
    api.post<LessonEditItem>(`/api/v1/chapters/${chapterId}/lessons`, input, { token: authToken() }),

  update: (id: number, input: UpdateLessonInput) =>
    api.put<LessonEditItem>(`/api/v1/lessons/${id}`, input, { token: authToken() }),

  remove: (id: number) =>
    api.delete<void>(`/api/v1/lessons/${id}`, { token: authToken() }),

  reorder: (chapterId: number, input: ReorderInput) =>
    api.put<void>(`/api/v1/chapters/${chapterId}/lessons/reorder`, input, { token: authToken() }),
};
