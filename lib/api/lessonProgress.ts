import { api, resolveBaseUrl } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { LessonProgressRecordReq, LessonProgressRes } from '@/types/domain';

export const lessonProgressApi = {
  /** UC21 — gọi định kỳ mỗi 15s + tại pause/seek (BR-PROGRESS-03). */
  record: (lessonId: number, req: LessonProgressRecordReq) =>
    api.post<LessonProgressRes>(`/api/v1/lessons/${lessonId}/progress`, req, {
      token: getAccessToken() ?? undefined,
    }),

  /**
   * Biến thể dùng lúc rời trang (`pagehide`) — `navigator.sendBeacon` không gắn được header
   * `Authorization` nên dùng `fetch(..., { keepalive: true })`, được trình duyệt đảm bảo gửi
   * xong ngay cả khi tab đã đóng, hỗ trợ header như fetch thường.
   */
  recordOnUnload: (lessonId: number, req: LessonProgressRecordReq) => {
    const token = getAccessToken();
    if (!token) return;
    void fetch(`${resolveBaseUrl()}/api/v1/lessons/${lessonId}/progress`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(req),
    }).catch(() => {
      // Tab đang đóng — không còn cách xử lý lỗi, bỏ qua.
    });
  },
};
