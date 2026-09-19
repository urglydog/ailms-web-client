import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { announcementApi, assignmentApi, messageApi, qaApi } from '@/lib/api/communication';
import { getAccessToken } from '@/lib/auth/token';

// ==================== Q&A ====================

export function useQaQuestions(params: { courseId?: number; onlyUnanswered?: boolean; page?: number }) {
  return useQuery({
    queryKey: ['qa', 'questions', params.courseId ?? 'all', params.onlyUnanswered ?? false, params.page ?? 0],
    queryFn: () => qaApi.listQuestions(params),
    enabled: !!getAccessToken(),
  });
}

export function useQaThread(questionId: string | null) {
  return useQuery({
    queryKey: ['qa', 'thread', questionId],
    queryFn: () => qaApi.getThread(questionId as string),
    enabled: !!getAccessToken() && !!questionId,
  });
}

export function useReplyToQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, content }: { questionId: string; content: string }) => qaApi.reply(questionId, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['qa'] });
      queryClient.invalidateQueries({ queryKey: ['qa', 'thread', variables.questionId] });
    },
  });
}

// ==================== Thông báo ====================

export function useInstructorAnnouncements(courseId?: number) {
  return useQuery({
    queryKey: ['announcements', 'instructor', courseId ?? 'all'],
    queryFn: () => announcementApi.listForInstructor(courseId),
    enabled: !!getAccessToken(),
  });
}

export function useCourseAnnouncements(courseId: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['announcements', 'course', courseId],
    queryFn: () => announcementApi.listForCourse(courseId as number),
    enabled: enabled && !!getAccessToken() && !!courseId,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: announcementApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: announcementApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

// ==================== Tin nhắn ====================

export function useConversations() {
  return useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: () => messageApi.listConversations(),
    enabled: !!getAccessToken(),
    refetchInterval: 15000,
  });
}

export function useConversationMessages(conversationId: number | null) {
  return useQuery({
    queryKey: ['messages', 'conversation', conversationId],
    queryFn: () => messageApi.getMessages(conversationId as number),
    enabled: !!getAccessToken() && !!conversationId,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: number; content: string }) =>
      messageApi.sendMessage(conversationId, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
    },
  });
}

export function useStartConversationAsStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: number) => messageApi.startAsStudent(courseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] }),
  });
}

export function useStartConversationAsInstructor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, courseId }: { studentId: number; courseId?: number }) =>
      messageApi.startAsInstructor(studentId, courseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] }),
  });
}

// ==================== Bài tập ====================

export function useInstructorAssignments(courseId?: number) {
  return useQuery({
    queryKey: ['assignments', 'instructor', courseId ?? 'all'],
    queryFn: () => assignmentApi.listForInstructor(courseId),
    enabled: !!getAccessToken(),
  });
}

export function useLessonAssignmentsForInstructor(lessonId: number | null) {
  return useQuery({
    queryKey: ['assignments', 'lesson', lessonId],
    queryFn: () => assignmentApi.listForLesson(lessonId as number),
    enabled: !!getAccessToken() && !!lessonId,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, ...req }: { lessonId: number; title: string; instructions: string; dueDate: string | null; maxScore: number | null }) =>
      assignmentApi.create(lessonId, req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', 'lesson', variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ['assignments', 'instructor'] });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignmentApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  });
}

export function useAssignmentSubmissions(assignmentId: number | null) {
  return useQuery({
    queryKey: ['assignments', 'submissions', assignmentId],
    queryFn: () => assignmentApi.listSubmissions(assignmentId as number),
    enabled: !!getAccessToken() && !!assignmentId,
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, score, feedback }: { submissionId: number; score: number | null; feedback: string }) =>
      assignmentApi.grade(submissionId, score, feedback),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments', 'submissions'] }),
  });
}

export function useLessonAssignmentsForStudent(lessonId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['assignments', 'student', lessonId],
    queryFn: () => assignmentApi.listForStudent(lessonId),
    enabled: enabled && !!getAccessToken(),
  });
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, ...data }: { assignmentId: number; lessonId: number; textContent?: string; file?: File | null }) =>
      assignmentApi.submit(assignmentId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', 'student', variables.lessonId] });
    },
  });
}
