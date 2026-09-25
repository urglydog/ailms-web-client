import { useQuery } from '@tanstack/react-query';
import { proctoringApi } from '@/lib/api/proctoring';

export const useProctoredAttempts = (courseId: number | undefined) => {
  return useQuery({
    queryKey: ['proctoring', 'attempts', courseId],
    queryFn: () => proctoringApi.getAttempts(courseId as number),
    enabled: !!courseId,
  });
};

export const useProctoredAttemptDetail = (attemptId: number | undefined) => {
  return useQuery({
    queryKey: ['proctoring', 'attempt-detail', attemptId],
    queryFn: () => proctoringApi.getAttemptDetail(attemptId as number),
    enabled: !!attemptId,
  });
};
