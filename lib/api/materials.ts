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
  title?: string;
  scopeType: ScopeType;
  scopeRefId?: number;
  customLessonIds?: number[];
  quantityLevel?: string;
  difficultyLevel?: string;
  extraConfig?: Record<string, unknown>;
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
  language?: string;
  versionNo?: number;
  materialId?: number;
  folderId?: number | null;
  questionCount?: number;
  randomPickCount?: number | null;
  allowReview?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number | null;
  maxAttempts?: number | null;
  attemptCount?: number;
  usageCount?: number;
  isProctored?: boolean;
  maxViolations?: number | null;
  quizType?: 'LECTURE_QUIZ' | 'OFFICIAL_EXAM';
  assignments?: { id: number, lessonId?: number, chapterId?: number, courseId?: number }[];
}



export interface MaterialGenerationRes {
  id: number;
  materialType: MaterialType;
  language: string;
  title: string | null;
  versionNo: number;
  status: GenStatus;
  createdAt: string;
  usageCount?: number;
}

/** Cùng nguồn `voice_mappings.is_active` với dropdown lồng tiếng (BR-DUB-07) — `available` ở đây
 * nghĩa là "đã có bản dịch sẵn" (dấu tích), KHÔNG phải "đã lồng tiếng xong"; chỉ là gợi ý hiển
 * thị, không hạn chế lựa chọn (BR-MAT-01 cho chọn ngôn ngữ đầu ra tự do). */
export interface LanguageAvailability {
  code: string;
  label: string;
  available: boolean;
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
    isMultipleChoice?: boolean;
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
    api.get<LanguageAvailability[]>(`/api/v1/materials/available-languages?courseId=${courseId}`, { token: authToken() }),

  getCourseChapters: (courseId: number) =>
    api.get<import('@/types/domain').Chapter[]>(`/api/v1/materials/course-chapters?courseId=${courseId}`, { token: authToken() }),
    
  renameMaterial: (id: number, title: string) =>
    api.patch(`/api/v1/materials/${id}`, { title }, { token: authToken() }),

  updateMaterial: (id: number, data: { title?: string; mermaidCode?: string }) =>
    api.patch(`/api/v1/materials/${id}`, data, { token: authToken() }),

  deleteMaterial: (id: number) =>
    api.delete(`/api/v1/materials/${id}`, { token: authToken() }),
    
  // Instructor APIs
  createManualMaterial: (courseId: number, input: { materialType: string; language: string; title: string; quizType?: string; scope?: string; scopeRefId?: string; customLessonIds?: string; allowReview?: boolean; maxAttempts?: number; durationMinutes?: number }) =>
    api.post<InstructorMaterial>(`/api/v1/instructor/materials/courses/${courseId}/manual`, {
      ...input,
      allowReview: input.allowReview?.toString(),
      maxAttempts: input.maxAttempts?.toString(),
      durationMinutes: input.durationMinutes?.toString()
    }, { token: authToken() }),

  getInstructorMaterials: (courseId: number) =>
    api.get<InstructorMaterial[]>(`/api/v1/instructor/materials/courses/${courseId}`, { token: authToken() }),
    
  setMindmapOfficial: (id: number, isOfficial: boolean) =>
    api.put(`/api/v1/instructor/materials/mindmaps/${id}/set-official?isOfficial=${isOfficial}`, undefined, { token: authToken() }),
    
  setFlashcardOfficial: (id: number, isOfficial: boolean) =>
    api.put(`/api/v1/instructor/materials/flashcards/${id}/set-official?isOfficial=${isOfficial}`, undefined, { token: authToken() }),
    
  setQuizOfficial: (id: number, isOfficial: boolean) =>
    api.put(`/api/v1/instructor/quizzes/${id}/set-official?isOfficial=${isOfficial}`, undefined, { token: authToken() }),
    

  // Epic 4 Versioning Overwrite
  overwriteMaterialVersion: (id: number, target: { targetLessonId?: number, targetChapterId?: number }) =>
    api.post(`/api/v1/instructor/materials/${id}/versioning-overwrite`, target, { token: authToken() }),

  // Đính kèm vào bài học cụ thể hoặc chương
  getFolders: (courseId: number) =>
    api.get<{id: number, name: string, parentId?: number}[]>(`/api/v1/instructor/material-folders/course/${courseId}`, { token: authToken() }),

  createFolder: (courseId: number, name: string, parentId?: number) =>
    api.post(`/api/v1/instructor/material-folders`, { courseId, name, parentId }, { token: authToken() }),

  deleteFolder: (id: number) =>
    api.delete(`/api/v1/instructor/material-folders/${id}`, { token: authToken() }),

  renameFolder: (id: number, name: string, courseId: number, parentId?: number) =>
    api.put(`/api/v1/instructor/material-folders/${id}`, { name, courseId, parentId }, { token: authToken() }),

  deleteAssignment: (assignmentId: number) =>
    api.delete(`/api/v1/instructor/materials/assignments/${assignmentId}`, { token: authToken() }),

  moveToFolder: (materialId: number, folderId: number | null) =>
    api.put(`/api/v1/instructor/materials/${materialId}/move-to-folder`, { folderId }, { token: authToken() }),

  attachMaterial: (id: number, target: { lessonId?: number | null; chapterId?: number | null }) =>
    api.put(`/api/v1/instructor/materials/${id}/attach-lesson`, target, { token: authToken() }),
    
  updateQuizSettings: (id: number, req: Record<string, unknown>) =>
    api.put(`/api/v1/instructor/quizzes/${id}/settings`, req, { token: authToken() }),

  updateQuizQuestion: (questionId: number, req: Record<string, unknown>) =>
    api.put(`/api/v1/instructor/quizzes/questions/${questionId}`, req, { token: authToken() }),

  addQuizQuestion: (quizId: number, req: Record<string, unknown>) =>
    api.post(`/api/v1/instructor/quizzes/${quizId}/questions`, req, { token: authToken() }),

  deleteQuizQuestion: (questionId: number) =>
    api.delete(`/api/v1/instructor/quizzes/questions/${questionId}`, { token: authToken() }),

  addFlashcard: (generationId: number, req: Record<string, unknown>) =>
    api.post(`/api/v1/flashcards/deck/${generationId}`, req, { token: authToken() }),

  updateFlashcard: (id: number, req: Record<string, unknown>) =>
    api.patch(`/api/v1/flashcards/${id}`, req, { token: authToken() }),

  deleteFlashcard: (id: number) =>
    api.delete(`/api/v1/flashcards/${id}`, { token: authToken() })
};
