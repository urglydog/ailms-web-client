import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { ActivateLiveLanguageTrackInput, LiveLanguageTrack } from '@/types/domain';

/**
 * UC52 (F11.3) — lồng tiếng live thời gian thực. `listActive` là public (badge hiện cho cả
 * Guest); `activate`/`deactivate` bắt buộc đăng nhập (BR-LIVE-02), gọi khi chưa có token sẽ
 * nhận 401/403 từ BE — nơi gọi phải tự chặn trước bằng {@code RequireLoginModal}.
 */
export const liveLanguageTrackApi = {
  listActive: (sessionId: number) =>
    api.get<LiveLanguageTrack[]>(`/api/v1/live-sessions/${sessionId}/language-tracks`, {
      token: getAccessToken() ?? undefined,
    }),

  activate: (sessionId: number, input: ActivateLiveLanguageTrackInput) =>
    api.post<LiveLanguageTrack>(`/api/v1/live-sessions/${sessionId}/language-tracks`, input, {
      token: getAccessToken() ?? undefined,
    }),

  deactivate: (sessionId: number, targetLanguage: string) =>
    api.delete<void>(
      `/api/v1/live-sessions/${sessionId}/language-tracks/${encodeURIComponent(targetLanguage)}`,
      { token: getAccessToken() ?? undefined },
    ),
};
