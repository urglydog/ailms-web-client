import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

/** Ghi chú gắn mốc thời gian video (26/11/2026) — chỉ ghi chú của chính học viên. */
export interface LessonNote {
  id: number;
  lessonId: number;
  lessonTitle: string;
  courseId: number;
  timestampSec: number;
  content: string;
  createdAt: string;
  updatedAt: string | null;
}

export type NoteScope = 'lesson' | 'course';

const auth = () => ({ token: getAccessToken() ?? undefined });

export const notesApi = {
  list: (lessonId: number, scope: NoteScope) =>
    api.get<LessonNote[]>(`/api/v1/lessons/${lessonId}/notes?scope=${scope}`, auth()),
  create: (lessonId: number, timestampSec: number, content: string) =>
    api.post<LessonNote>(`/api/v1/lessons/${lessonId}/notes`, { timestampSec, content }, auth()),
  update: (noteId: number, content: string) =>
    api.put<LessonNote>(`/api/v1/notes/${noteId}`, { content }, auth()),
  remove: (noteId: number) => api.delete<void>(`/api/v1/notes/${noteId}`, auth()),
};

/** Thẻ câu hỏi gợi ý của Gia sư AI (26/11/2026). */
export interface TutorSuggestion {
  text: string;
  source: 'POPULAR' | 'AI' | 'TEMPLATE';
  /** Chỉ với TEMPLATE: summary | quiz | hardest | relation | chapter — FE dịch theo khóa này. */
  key: string | null;
  params: Record<string, string>;
}

export const tutorSuggestionsApi = {
  list: (lessonId: number) => api.get<TutorSuggestion[]>(`/api/v1/lessons/${lessonId}/tutor-suggestions`, auth()),
};

/** `m:ss` hoặc `h:mm:ss`. */
export function formatTimestamp(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = (s % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${r}` : `${m}:${r}`;
}
