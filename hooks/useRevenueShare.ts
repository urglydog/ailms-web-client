import { useQuery } from '@tanstack/react-query';
import { revenueShareApi } from '@/lib/api/revenueShare';
import { getAccessToken } from '@/lib/auth/token';

export function useRevenueShare() {
  return useQuery({
    queryKey: ['instructor', 'revenue-share'],
    queryFn: () => revenueShareApi.get(),
    enabled: !!getAccessToken(),
    staleTime: 5 * 60 * 1000,
  });
}
