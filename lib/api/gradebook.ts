import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

function authToken() {
  return getAccessToken() ?? undefined;
}

export interface StudentGradeDto {
  userId: number;
  fullName: string;
  email: string;
  attemptCount: number;
  highestScore: number;
  latestScore: number;
  latestSubmittedAt: string | null;
  passed: boolean;
  latestAttemptId: number | null;
}

export interface GradebookRes {
  courseId: number;
  courseTitle: string;
  totalStudents: number;
  totalAttempts: number;
  averageScore: number;
  passRatePercentage: number;
  hasOfficialQuiz: boolean;
  students: StudentGradeDto[];
}

export interface AnswerInspectionDto {
  questionId: number;
  questionContent: string;
  selectedOptionId: number | null;
  correctOptionId: number | null;
  isCorrect: boolean;
  options: {
    id: number;
    content: string;
    isCorrect: boolean;
  }[];
}

export interface AttemptInspectionRes {
  attemptId: number;
  studentName: string;
  studentEmail: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  answers: AnswerInspectionDto[];
}

export const gradebookApi = {
  getGradebook: (courseId: number) =>
    api.get<GradebookRes>(`/api/v1/instructor/courses/${courseId}/gradebook`, { token: authToken() }),

  getAttemptDetail: (courseId: number, attemptId: number) =>
    api.get<AttemptInspectionRes>(`/api/v1/instructor/courses/${courseId}/gradebook/attempts/${attemptId}/detail`, { token: authToken() }),
};
