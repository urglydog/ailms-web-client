import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

/** Insight từ Gia sư AI cho giảng viên (26/11/2026) — chỉ số liệu gộp, không tên/câu nguyên văn. */
export interface InsightTopic {
  label: string;
  learnerCount: number;
  questionCount: number;
}

export interface LessonInsight {
  lessonId: number;
  lessonTitle: string;
  questionCount: number;
  learnerCount: number;
  unusual: boolean;
  poorCount: number;
  topics: InsightTopic[];
}

export interface PoorTopic {
  lessonId: number;
  lessonTitle: string;
  label: string;
  reason: 'REPEAT' | 'NOT_COVERED';
  learnerCount: number;
}

export interface InsightSummary {
  status: 'NONE' | 'PENDING' | 'READY' | 'FAILED';
  text: string | null;
  actions: string[];
  generatedAt: string | null;
}

export interface CourseInsight {
  courseId: number;
  windowDays: number;
  totalQuestions: number;
  learnerCount: number;
  lessons: LessonInsight[];
  poorTopics: PoorTopic[];
  summary: InsightSummary;
}

const auth = () => ({ token: getAccessToken() ?? undefined });

export const tutorInsightsApi = {
  get: (courseId: number, lessonId?: number) =>
    api.get<CourseInsight>(
      `/api/v1/instructor/courses/${courseId}/tutor-insights${lessonId ? `?lessonId=${lessonId}` : ''}`,
      auth(),
    ),
  refreshSummary: (courseId: number) =>
    api.post<InsightSummary>(`/api/v1/instructor/courses/${courseId}/tutor-insights/summary`, undefined, auth()),
};
