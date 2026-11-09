import { api, uploadFile } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { CreateLiveSessionInput, LiveSession, LiveSessionStartRes } from '@/types/domain';

/** UC50 (F11.1) — vòng đời phiên Live, phía giảng viên sở hữu khóa học. */
export const liveApi = {
  listMine: () =>
    api.get<LiveSession[]>('/api/v1/live-sessions', { token: getAccessToken() ?? undefined }),

  getOwned: (sessionId: number) =>
    api.get<LiveSession>(`/api/v1/live-sessions/${sessionId}`, { token: getAccessToken() ?? undefined }),

  create: (input: CreateLiveSessionInput) =>
    api.post<LiveSession>('/api/v1/live-sessions', input, { token: getAccessToken() ?? undefined }),

  start: (sessionId: number) =>
    api.post<LiveSessionStartRes>(`/api/v1/live-sessions/${sessionId}/start`, undefined, {
      token: getAccessToken() ?? undefined,
    }),

  end: (sessionId: number) =>
    api.post<LiveSession>(`/api/v1/live-sessions/${sessionId}/end`, undefined, {
      token: getAccessToken() ?? undefined,
    }),

  /** F11.9 mở rộng — ảnh riêng cho buổi live, không bắt buộc (fallback ảnh bìa khóa học ở BE). */
  uploadThumbnail: (sessionId: number, file: File, onProgress?: (percent: number) => void) =>
    uploadFile<LiveSession>(`/api/v1/live-sessions/${sessionId}/thumbnail`, file, {
      token: getAccessToken() ?? undefined,
      onProgress,
    }),
};
