import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

interface LiveOriginalSubtitleRes {
  listenerCount: number;
}

/** F11.5 mở rộng — "Phụ đề gốc" độc lập với lồng tiếng. Bắt buộc đăng nhập (BR-LIVE-02), giống
 * hệt cơ chế kích hoạt ngôn ngữ dịch — gọi khi chưa có token sẽ nhận 401/403 từ BE. */
export const liveOriginalSubtitleApi = {
  activate: (sessionId: number) =>
    api.post<LiveOriginalSubtitleRes>(`/api/v1/live-sessions/${sessionId}/original-subtitle`, undefined, {
      token: getAccessToken() ?? undefined,
    }),

  deactivate: (sessionId: number) =>
    api.delete<LiveOriginalSubtitleRes>(`/api/v1/live-sessions/${sessionId}/original-subtitle`, {
      token: getAccessToken() ?? undefined,
    }),
};
