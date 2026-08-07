import { useQuery } from '@tanstack/react-query';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { getAccessToken } from '@/lib/auth/token';

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['enrollments', 'mine'],
    queryFn: () => enrollmentsApi.listMine(),
    enabled: !!getAccessToken(),
  });
}
