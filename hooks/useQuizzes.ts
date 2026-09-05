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
