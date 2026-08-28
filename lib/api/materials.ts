import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

function authToken() {
  return getAccessToken() ?? undefined;
}

export type MaterialType = 'MINDMAP' | 'QUIZ' | 'FLASHCARD';
export type ScopeType = 'WHOLE_COURSE' | 'CHAPTER' | 'CUSTOM_LESSONS';
export type GenStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface MaterialGenerationReq {
  courseId: number;
  materialType: MaterialType;
  language: string;
  scopeType: ScopeType;
  scopeRefId?: number;
  customLessonIds?: number[];
  quantityLevel?: string;
  difficultyLevel?: string;
}

export interface MaterialGenerationRes {
  id: number;
  materialType: MaterialType;
  language: string;
  title: string | null;
  versionNo: number;
  status: GenStatus;
  createdAt: string;
}

export interface MaterialDetailRes extends MaterialGenerationRes {
  mermaidCode?: string;
  flashcards?: {
    id: number;
    frontText: string;
    backText: string;
  }[];
  quizQuestions?: {
    id: number;
    content: string;
    displayOrder: number;
    options: {
      id: number;
      content: string;
      isCorrect: boolean;
    }[];
  }[];
}

export const materialsApi = {
  requestGeneration: (input: MaterialGenerationReq) =>
    api.post<MaterialGenerationRes>('/api/v1/materials', input, { token: authToken() }),

  listForCourse: (courseId: number) =>
    api.get<MaterialGenerationRes[]>(`/api/v1/materials?courseId=${courseId}`, { token: authToken() }),

  getDetail: (id: number) =>
    api.get<MaterialDetailRes>(`/api/v1/materials/${id}`, { token: authToken() }),

  getAvailableLanguages: (courseId: number) =>
    api.get<string[]>(`/api/v1/materials/available-languages?courseId=${courseId}`, { token: authToken() }),

  getCourseChapters: (courseId: number) =>
    api.get<import('@/types/domain').Chapter[]>(`/api/v1/materials/course-chapters?courseId=${courseId}`, { token: authToken() }),
};
