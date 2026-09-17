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
  isMultipleChoice?: boolean;
  options: OptionDto[];
}

export interface UpdateQuestionReq {
  content?: string;
  displayOrder?: number;
  isMultipleChoice?: boolean;
  options?: Omit<OptionDto, 'id'>[];
}

export interface AddQuestionReq {
  content: string;
  displayOrder: number;
  isMultipleChoice?: boolean;
  options: Omit<OptionDto, 'id'>[];
}

export interface StartRes {
  attemptId: number;
  quizId: number;
  questions: QuestionDto[];
  isProctored?: boolean;
  maxViolations?: number;
  durationMinutes?: number | null;
  startedAt?: string;
}

export interface SubmitReq {
  answers: Record<number, number[]>;
}

export interface AnswerDetailDto {
  questionId: number;
  content: string;
  selectedOptionIds: number[];
  correctOptionIds: number[] | null;
  isCorrect: boolean | null;
  options: OptionDto[];
}

export interface SubmitRes {
  attemptId: number;
  score: number;
  correctCount: number;
  totalQuestions: number;
  details: AnswerDetailDto[];
  isArchived?: boolean;
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
  submittedAt: string | number[];
  quizId: number;
  status: string;
  isArchived?: boolean;
  allowReview?: boolean;
}

export const quizApi = {
  setOfficial: (quizId: number, isOfficial: boolean) => {
    return api.put(`/api/v1/instructor/quizzes/${quizId}/set-official?isOfficial=${isOfficial}`, {}, { token: authToken() });
  },

  startAttempt: (quizId: number) => {
    return api.get<StartRes>(`/api/v1/quizzes/${quizId}/start-attempt`, { token: authToken() });
  },

  submitAttempt: (attemptId: number, data: SubmitReq) => {
    return api.post<SubmitRes>(`/api/v1/quizzes/attempts/${attemptId}/submit`, data, { token: authToken() });
  },

  getAttemptHistory: (quizId: number) => {
    return api.get<HistoryRes[]>(`/api/v1/quizzes/${quizId}/attempts`, { token: authToken() });
  },

  getAttemptDetail: (attemptId: number) => {
    return api.get<SubmitRes>(`/api/v1/quizzes/attempts/${attemptId}`, { token: authToken() });
  },

  explainWrongAnswer: (data: ExplainReq) => {
    return api.post<ExplainRes>(`/api/v1/quizzes/tutor/explain`, data, { token: authToken() });
  },

  updateQuestion: (questionId: number, data: UpdateQuestionReq) => {
    return api.put(`/api/v1/quizzes/questions/${questionId}`, data, { token: authToken() });
  },

  addQuestion: (quizId: number, data: AddQuestionReq) => {
    return api.post(`/api/v1/quizzes/${quizId}/questions`, data, { token: authToken() });
  },

  deleteQuestion: (questionId: number) => {
    return api.delete(`/api/v1/quizzes/questions/${questionId}`, { token: authToken() });
  },
};
