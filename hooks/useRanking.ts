import { useQuery } from '@tanstack/react-query';
import { rankingApi } from '@/lib/api/ranking';

export function useLeaderboard(limit: number = 5) {
  return useQuery({
    queryKey: ['ranking', 'leaderboard', limit],
    queryFn: () => rankingApi.getLeaderboard(limit),
    staleTime: 5 * 60 * 1000,
  });
}

/** `enabled` — chỉ gọi khi đã biết chắc đang đăng nhập (tránh gọi `/me` vô ích cho khách). */
export function useMyRanking(enabled: boolean) {
  return useQuery({
    queryKey: ['ranking', 'me'],
    queryFn: rankingApi.getMyRanking,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
