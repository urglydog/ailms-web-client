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

export interface AnswerDetailDto {
  questionId: number;
  content: string;
  selectedOptionId: number | null;
  correctOptionId: number | null;
  isCorrect: boolean;
  options: OptionDto[];
}

export interface SubmitRes {
  attemptId: number;
  score: number;
  correctCount: number;
  totalQuestions: number;
  details: AnswerDetailDto[];
}

export interface ExplainReq {
  questionId: number;
  selectedOptionId: number | null;
}

export interface ExplainRes {
  explanation: string;
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

  startAttempt: (quizId: number) => {
    return api.get<StartRes>(`/api/v1/quizzes/${quizId}/start-attempt`, { token: authToken() });
  },

  submitAttempt: (attemptId: number, data: SubmitReq) => {
    return api.post<SubmitRes>(`/api/v1/quizzes/attempts/${attemptId}/submit`, data, { token: authToken() });
  },

  getAttemptHistory: (courseId: number) => {
    return api.get<HistoryRes[]>(`/api/v1/courses/${courseId}/quizzes/attempts`, { token: authToken() });
  },

  explainWrongAnswer: (data: ExplainReq) => {
    return api.post<ExplainRes>(`/api/v1/quizzes/tutor/explain`, data, { token: authToken() });
  },
};
