import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';

/** "View public profile" (14/09/2026, mở rộng ngoài đặc tả gốc) — xem được không cần đăng nhập. */
export function usePublicProfile(userId: number) {
  return useQuery({
    queryKey: ['users', userId, 'public-profile'],
    queryFn: () => usersApi.getPublicProfile(userId),
    enabled: Number.isFinite(userId),
  });
}
