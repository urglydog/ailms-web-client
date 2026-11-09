import { useQuery } from '@tanstack/react-query';
import { tutorSecurityApi } from '@/lib/api/tutorSecurity';
import { getAccessToken } from '@/lib/auth/token';

/** BR-TUTOR-SEC-06 — danh sách tin nhắn học viên bị pre-check heuristic của Socratic Tutor Agent
 * gắn cờ, mới nhất trước. */
export function useTutorSecurityFlags(params: { page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ['admin', 'tutor-security-flags', params],
    queryFn: () => tutorSecurityApi.listFlags(params),
    enabled: !!getAccessToken(),
  });
}
