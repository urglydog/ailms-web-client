import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { Page, TutorSecurityFlag } from '@/types/domain';

function authToken() {
  return getAccessToken() ?? undefined;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

/** BR-TUTOR-SEC-06 — Admin xem lại các tin nhắn học viên bị pre-check heuristic của Socratic
 * Tutor Agent gắn cờ. */
export const tutorSecurityApi = {
  listFlags: (params: { page?: number; size?: number } = {}) =>
    api.get<Page<TutorSecurityFlag>>(
      `/api/v1/admin/tutor-security/flags${buildQuery(params)}`,
      { token: authToken() },
    ),
};
