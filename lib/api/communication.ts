import { api, resolveBaseUrl, ApiError } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

function authToken() {
  return getAccessToken() ?? undefined;
}

// ==================== Q&A (Giao tiếp > Hỏi đáp) ====================

export interface QaQuestion {
  id: string;
  lessonId: number;
  lessonTitle: string;
  courseId: number;
  courseTitle: string;
  userName: string;
  content: string;
  createdAt: string;
  answerCount: number;
  hasInstructorAnswer: boolean;
}

export interface QaAnswer {
  id: string;
  userName: string;
  content: string;
  createdAt: string;
  isInstructor: boolean;
}

export interface QaThread {
  question: QaQuestion;
  answers: QaAnswer[];
}

export interface PageRes<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export const qaApi = {
  listQuestions: (params: { courseId?: number; onlyUnanswered?: boolean; page?: number }) => {
    const qs = new URLSearchParams();
    if (params.courseId) qs.set('courseId', String(params.courseId));
    if (params.onlyUnanswered) qs.set('onlyUnanswered', 'true');
    qs.set('page', String(params.page ?? 0));
    return api.get<PageRes<QaQuestion>>(`/api/v1/instructor/qa/questions?${qs.toString()}`, { token: authToken() });
  },
  getThread: (questionId: string) =>
    api.get<QaThread>(`/api/v1/instructor/qa/questions/${questionId}`, { token: authToken() }),
  reply: (questionId: string, content: string) =>
    api.post<void>(`/api/v1/instructor/qa/questions/${questionId}/reply`, { content }, { token: authToken() }),
};

// ==================== Thông báo (Announcements) ====================

export interface AnnouncementItem {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  content: string;
  createdAt: string;
}

export const announcementApi = {
  create: (req: { courseId: number; title: string; content: string }) =>
    api.post<AnnouncementItem>('/api/v1/instructor/announcements', req, { token: authToken() }),
  listForInstructor: (courseId?: number) =>
    api.get<AnnouncementItem[]>(
      `/api/v1/instructor/announcements${courseId ? `?courseId=${courseId}` : ''}`,
      { token: authToken() },
    ),
  delete: (id: number) =>
    api.delete<void>(`/api/v1/instructor/announcements/${id}`, { token: authToken() }),
  listForCourse: (courseId: number) =>
    api.get<AnnouncementItem[]>(`/api/v1/courses/${courseId}/announcements`, { token: authToken() }),
};

// ==================== Tin nhắn (Messages) ====================

export interface ConversationItem {
  id: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatarUrl: string | null;
  courseId: number | null;
  courseTitle: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

export interface MessageItem {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  createdAt: string;
  mine: boolean;
}

export const messageApi = {
  listConversations: () =>
    api.get<ConversationItem[]>('/api/v1/messages/conversations', { token: authToken() }),
  getMessages: (conversationId: number) =>
    api.get<MessageItem[]>(`/api/v1/messages/conversations/${conversationId}`, { token: authToken() }),
  sendMessage: (conversationId: number, content: string) =>
    api.post<MessageItem>(`/api/v1/messages/conversations/${conversationId}`, { content }, { token: authToken() }),
  startAsStudent: (courseId: number) =>
    api.post<ConversationItem>('/api/v1/messages/conversations/start', { courseId, studentId: null }, { token: authToken() }),
  startAsInstructor: (studentId: number, courseId?: number) =>
    api.post<ConversationItem>(
      '/api/v1/messages/conversations/start-as-instructor',
      { courseId: courseId ?? null, studentId },
      { token: authToken() },
    ),
};

// ==================== Bài tập (Assignments) ====================

export interface AssignmentItem {
  id: number;
  lessonId: number;
  lessonTitle: string;
  courseId: number;
  courseTitle: string;
  title: string;
  instructions: string | null;
  dueDate: string | null;
  maxScore: number | null;
  createdAt: string;
  submissionCount: number;
  gradedCount: number;
}

export interface AssignmentSubmissionItem {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  textContent: string | null;
  fileUrl: string | null;
  fileName: string | null;
  submittedAt: string;
  score: number | null;
  feedback: string | null;
  gradedAt: string | null;
}

export interface StudentAssignmentItem {
  assignment: AssignmentItem;
  mySubmission: AssignmentSubmissionItem | null;
}

async function submitAssignmentMultipart(
  assignmentId: number,
  data: { textContent?: string; file?: File | null },
): Promise<AssignmentSubmissionItem> {
  const formData = new FormData();
  if (data.textContent) formData.append('textContent', data.textContent);
  if (data.file) formData.append('file', data.file);

  const token = authToken();
  const res = await fetch(`${resolveBaseUrl()}/api/v1/assignments/${assignmentId}/submissions`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  if (!res.ok) {
    const problem = await res.json().catch(() => ({
      type: 'about:blank', title: res.statusText, status: res.status,
      detail: 'Không nộp được bài tập', instance: '', code: 'SUBMIT_FAILED', timestamp: new Date().toISOString(),
    }));
    throw new ApiError(problem);
  }
  return res.json();
}

export const assignmentApi = {
  create: (lessonId: number, req: { title: string; instructions: string; dueDate: string | null; maxScore: number | null }) =>
    api.post<AssignmentItem>(`/api/v1/instructor/lessons/${lessonId}/assignments`, req, { token: authToken() }),
  listForLesson: (lessonId: number) =>
    api.get<AssignmentItem[]>(`/api/v1/instructor/lessons/${lessonId}/assignments`, { token: authToken() }),
  listForInstructor: (courseId?: number) =>
    api.get<AssignmentItem[]>(
      `/api/v1/instructor/assignments${courseId ? `?courseId=${courseId}` : ''}`,
      { token: authToken() },
    ),
  delete: (id: number) =>
    api.delete<void>(`/api/v1/instructor/assignments/${id}`, { token: authToken() }),
  listSubmissions: (assignmentId: number) =>
    api.get<AssignmentSubmissionItem[]>(`/api/v1/instructor/assignments/${assignmentId}/submissions`, { token: authToken() }),
  grade: (submissionId: number, score: number | null, feedback: string) =>
    api.patch<AssignmentSubmissionItem>(
      `/api/v1/instructor/assignments/submissions/${submissionId}/grade`,
      { score, feedback },
      { token: authToken() },
    ),
  listForStudent: (lessonId: number) =>
    api.get<StudentAssignmentItem[]>(`/api/v1/lessons/${lessonId}/assignments`, { token: authToken() }),
  submit: submitAssignmentMultipart,
};
