import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  hasStudiedToday: boolean;
  learningDays: string[]; // ISO date strings
}

export function useStreak() {
  return useQuery({
    queryKey: ['streak', 'me'],
    queryFn: () => {
      let timezone = 'Asia/Ho_Chi_Minh';
      try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (e) {
        // Fallback
      }
      return api.get<StreakResponse>('/api/v1/streak/me', {
        headers: {
          'X-Timezone': timezone,
        },
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Do not retry if 401
  });
}
