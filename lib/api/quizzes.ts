import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

function authToken() {
  return getAccessToken() ?? undefined;
}

export interface OptionDto {
  id: number;
  content: string;
  displayOrder: number;
}

export interface QuestionDto {
  id: number;
  content: string;
  displayOrder: number;
  options: OptionDto[];
}

export interface StartRes {
  attemptId: number;
  quizId: number;
  questions: QuestionDto[];
}

export interface SubmitReq {
  answers: Record<number, number>;
}

export interface SubmitRes {
  attemptId: number;
  score: number;
  correctCount: number;
  totalQuestions: number;
}

export interface HistoryRes {
  id: number;
  score: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  quizId: number;
}

export const quizApi = {
  setOfficial: (quizId: number) => {
    return api.put(`/api/v1/instructor/quizzes/${quizId}/set-official`, {}, { token: authToken() });
  },

  startAttempt: (courseId: number) => {
    return api.get<StartRes>(`/api/v1/courses/${courseId}/quizzes/official/attempt`, { token: authToken() });
  },

  submitAttempt: (attemptId: number, data: SubmitReq) => {
    return api.post<SubmitRes>(`/api/v1/quizzes/attempts/${attemptId}/submit`, data, { token: authToken() });
  },

  getAttemptHistory: (courseId: number) => {
    return api.get<HistoryRes[]>(`/api/v1/courses/${courseId}/quizzes/attempts`, { token: authToken() });
  },
};
