import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

function authToken() {
  return getAccessToken() ?? undefined;
}

/** UC-ANTICHEAT — màn hình "Giám sát thi" cho giảng viên, trong context 1 khoá học. */
export interface ProctoredAttemptSummary {
  attemptId: number;
  quizTitle: string | null;
  studentName: string;
  studentEmail: string;
  submittedAt: string | number[];
  violationCount: number;
  aiRiskLevel: string | null;
  hasRecording: boolean;
}

export interface ViolationMarker {
  type: string;
  detail: string | null;
  offsetSec: number;
}

export interface ProctoredAttemptDetail {
  attemptId: number;
  studentName: string;
  studentEmail: string;
  submittedAt: string | number[];
  violationCount: number;
  aiRiskLevel: string | null;
  aiRiskExplanation: string | null;
  videoUrl: string | null;
  durationSec: number | null;
  violations: ViolationMarker[];
}

export const proctoringApi = {
  getAttempts: (courseId: number) =>
    api.get<ProctoredAttemptSummary[]>(`/api/v1/instructor/proctoring/courses/${courseId}/attempts`, { token: authToken() }),

  getAttemptDetail: (attemptId: number) =>
    api.get<ProctoredAttemptDetail>(`/api/v1/instructor/proctoring/attempts/${attemptId}`, { token: authToken() }),
};
