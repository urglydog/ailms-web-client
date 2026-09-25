import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '@/lib/api/quizzes';
import { SubmitReq } from '@/lib/api/quizzes';

export const useStartQuiz = () => {
  return useMutation({
    mutationFn: (quizId: number) => quizApi.startAttempt(quizId),
  });
};

export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attemptId, data }: { attemptId: number; data: SubmitReq }) =>
      quizApi.submitAttempt(attemptId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizHistory'] });
      queryClient.invalidateQueries({ queryKey: ['course-materials'] });
    }
  });
};

export const useQuizHistory = (quizId: number) => {
  return useQuery({
    queryKey: ['quizHistory', quizId],
    queryFn: () => quizApi.getAttemptHistory(quizId),
    enabled: !!quizId,
  });
};

export const useAttemptDetail = (attemptId: number) => {
  return useQuery({
    queryKey: ['attemptDetail', attemptId],
    queryFn: () => quizApi.getAttemptDetail(attemptId),
    enabled: !!attemptId,
  });
};

export const useExplainWrongAnswer = () => {
  return useMutation({
    mutationFn: (data: import('@/lib/api/quizzes').ExplainReq) => quizApi.explainWrongAnswer(data),
  });
};

/** UC-ANTICHEAT — ghi nhận 1 vi phạm rời rạc, server-side (thay cho localStorage trước đây). */
export const useRecordViolation = () => {
  return useMutation({
    mutationFn: ({ attemptId, data }: { attemptId: number; data: import('@/lib/api/quizzes').ViolationReq }) =>
      quizApi.recordViolation(attemptId, data),
  });
};

/** UC-ANTICHEAT — gửi khung hình webcam cho Gemini Vision xác minh thật (đếm người + hướng nhìn). */
export const useAnalyzeProctorFrame = () => {
  return useMutation({
    mutationFn: ({ attemptId, data }: { attemptId: number; data: import('@/lib/api/quizzes').ProctorFrameReq }) =>
      quizApi.analyzeProctorFrame(attemptId, data),
  });
};

export const useUpdatePersonalQuestion = () => {
  return useMutation({
    mutationFn: ({ questionId, data }: { questionId: number; data: import('@/lib/api/quizzes').UpdateQuestionReq }) => quizApi.updateQuestion(questionId, data),
  });
};

export const useAddPersonalQuestion = () => {
  return useMutation({
    mutationFn: ({ quizId, data }: { quizId: number; data: import('@/lib/api/quizzes').AddQuestionReq }) => quizApi.addQuestion(quizId, data),
  });
};

export const useDeletePersonalQuestion = () => {
  return useMutation({
    mutationFn: (questionId: number) => quizApi.deleteQuestion(questionId),
  });
};
