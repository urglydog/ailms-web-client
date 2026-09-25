import { useQuery } from '@tanstack/react-query';
import { proctoringApi } from '@/lib/api/proctoring';

export const useProctoredQuizzes = (courseId: number | undefined) => {
  return useQuery({
    queryKey: ['proctoring', 'quizzes', courseId],
    queryFn: () => proctoringApi.getProctoredQuizzes(courseId as number),
    enabled: !!courseId,
  });
};

export const useProctoredAttempts = (quizId: number | undefined) => {
  return useQuery({
    queryKey: ['proctoring', 'attempts', quizId],
    queryFn: () => proctoringApi.getAttempts(quizId as number),
    enabled: !!quizId,
  });
};

export const useProctoredAttemptDetail = (attemptId: number | undefined) => {
  return useQuery({
    queryKey: ['proctoring', 'attempt-detail', attemptId],
    queryFn: () => proctoringApi.getAttemptDetail(attemptId as number),
    enabled: !!attemptId,
  });
};
