import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { LeaderboardEntry, MyRanking } from '@/types/domain';

/** Ranking cộng đồng theo XP (UpComming_Plan.md, Epic "Ranking cộng đồng"). */
export const rankingApi = {
  /** Công khai, không cần đăng nhập — banner trang chủ hiện được cho cả khách vãng lai. */
  getLeaderboard: (limit: number = 5) =>
    api.get<LeaderboardEntry[]>(`/api/v1/ranking/leaderboard?limit=${limit}`),

  getMyRanking: () =>
    api.get<MyRanking>('/api/v1/ranking/me', { token: getAccessToken() ?? undefined }),
};
