import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { ChapterEditItem, CreateChapterInput, ReorderInput, UpdateChapterInput } from '@/types/domain';

function authToken() {
  return getAccessToken() ?? undefined;
}

export const chaptersApi = {
  create: (courseId: number, input: CreateChapterInput) =>
    api.post<ChapterEditItem>(`/api/v1/courses/mine/${courseId}/chapters`, input, { token: authToken() }),

  update: (id: number, input: UpdateChapterInput) =>
    api.put<ChapterEditItem>(`/api/v1/chapters/${id}`, input, { token: authToken() }),

  remove: (id: number) =>
    api.delete<void>(`/api/v1/chapters/${id}`, { token: authToken() }),

  reorder: (courseId: number, input: ReorderInput) =>
    api.put<void>(`/api/v1/courses/mine/${courseId}/chapters/reorder`, input, { token: authToken() }),
};
