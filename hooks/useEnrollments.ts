import { useQuery } from '@tanstack/react-query';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { canUseLearnerFeatures } from '@/lib/auth/token';

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['enrollments', 'mine'],
    queryFn: () => enrollmentsApi.listMine(),
    enabled: canUseLearnerFeatures(),
  });
}
