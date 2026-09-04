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

export interface BaseMaterial {
  id: number;
  materialType: 'MINDMAP' | 'FLASHCARD' | 'QUIZ';
  title: string;
  description: string;
  status: string;
}

export interface InstructorMaterial {
  id: number;
  materialType: string;
  title: string;
  createdAt: string;
  status: string;
  isOfficial: boolean;
  materialId?: number;
  randomPickCount?: number | null;
  allowReview?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number | null;
  maxAttempts?: number | null;
  isProctored?: boolean;
  maxViolations?: number | null;
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
    nextReviewAt: string;
    intervalDays: number;
    repetitions: number;
    easiness: number;
    isDue: boolean;
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
    
  // Instructor APIs
  // Instructor APIs
  getInstructorMaterials: (courseId: number) =>
    api.get<InstructorMaterial[]>(`/api/v1/instructor/materials/courses/${courseId}`, { token: authToken() }),
    
  setMindmapOfficial: (id: number, isOfficial: boolean) =>
    api.put(`/api/v1/instructor/materials/mindmaps/${id}/set-official?isOfficial=${isOfficial}`, undefined, { token: authToken() }),
    
  setFlashcardOfficial: (id: number, isOfficial: boolean) =>
    api.put(`/api/v1/instructor/materials/flashcards/${id}/set-official?isOfficial=${isOfficial}`, undefined, { token: authToken() }),
    
  setQuizOfficial: (id: number) =>
    api.put(`/api/v1/instructor/quizzes/${id}/set-official`, undefined, { token: authToken() }),
    
  updateQuizSettings: (id: number, req: Record<string, unknown>) =>
    api.put(`/api/v1/instructor/quizzes/${id}/settings`, req, { token: authToken() })
};
