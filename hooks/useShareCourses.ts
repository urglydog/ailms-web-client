import { useQuery } from '@tanstack/react-query';
import { shareApi } from '@/lib/api/finance';
import { getAccessToken } from '@/lib/auth/token';

export function useShareCourses(from?: string, to?: string) {
  return useQuery({
    queryKey: ['instructor', 'share', 'courses', from ?? 'all', to ?? 'all'],
    queryFn: () => shareApi.courses(from, to),
    enabled: !!getAccessToken(),
  });
}
