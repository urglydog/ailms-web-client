import { apiClient } from './client';

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
    return apiClient.put(`/api/v1/instructor/quizzes/${quizId}/set-official`, {});
  },

  startAttempt: (courseId: number) => {
    return apiClient.get<StartRes>(`/api/v1/courses/${courseId}/quizzes/official/attempt`);
  },

  submitAttempt: (attemptId: number, data: SubmitReq) => {
    return apiClient.post<SubmitRes>(`/api/v1/quizzes/attempts/${attemptId}/submit`, data);
  },

  getAttemptHistory: (courseId: number) => {
    return apiClient.get<HistoryRes[]>(`/api/v1/courses/${courseId}/quizzes/attempts`);
  },
};
