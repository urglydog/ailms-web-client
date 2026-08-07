import { api, uploadFile } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type {
  CreateLessonInput,
  LessonDocumentItem,
  LessonEditItem,
  ReorderInput,
  SetYoutubeVideoInput,
  UpdateLessonInput,
} from '@/types/domain';

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

  // ── Giai đoạn 4 (UC34) — nạp video bài giảng ───────────────────
  uploadVideo: (lessonId: number, file: File, onProgress?: (percent: number) => void) =>
    uploadFile<LessonEditItem>(`/api/v1/lessons/${lessonId}/video/upload`, file, {
      token: authToken(),
      onProgress,
    }),

  setYoutubeVideo: (lessonId: number, input: SetYoutubeVideoInput) =>
    api.post<LessonEditItem>(`/api/v1/lessons/${lessonId}/video/youtube`, input, { token: authToken() }),

  // ── Giai đoạn 4 (UC35) — tài liệu đính kèm ─────────────────────
  listDocuments: (lessonId: number) =>
    api.get<LessonDocumentItem[]>(`/api/v1/lessons/${lessonId}/documents`, { token: authToken() }),

  uploadDocument: (lessonId: number, file: File, onProgress?: (percent: number) => void) =>
    uploadFile<LessonDocumentItem>(`/api/v1/lessons/${lessonId}/documents`, file, {
      token: authToken(),
      onProgress,
    }),

  deleteDocument: (documentId: number) =>
    api.delete<void>(`/api/v1/lesson-documents/${documentId}`, { token: authToken() }),
};
