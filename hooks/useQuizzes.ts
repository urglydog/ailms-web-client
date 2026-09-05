import { useMutation, useQuery } from '@tanstack/react-query';
import { quizApi } from '@/lib/api/quizzes';
import { StartRes, SubmitReq, SubmitRes, HistoryRes } from '@/lib/api/quizzes';

export const useStartQuiz = () => {
  return useMutation({
    mutationFn: (quizId: number) => quizApi.startAttempt(quizId),
  });
};

export const useSubmitQuiz = () => {
  return useMutation({
    mutationFn: ({ attemptId, data }: { attemptId: number; data: SubmitReq }) =>
      quizApi.submitAttempt(attemptId, data),
  });
};

export const useQuizHistory = (courseId: number) => {
  return useQuery({
    queryKey: ['quizHistory', courseId],
    queryFn: () => quizApi.getAttemptHistory(courseId),
    enabled: !!courseId,
  });
};

export const useExplainWrongAnswer = () => {
  return useMutation({
    mutationFn: (data: import('@/lib/api/quizzes').ExplainReq) => quizApi.explainWrongAnswer(data),
  });
};
