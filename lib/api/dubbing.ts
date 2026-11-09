import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { DubbingActivateResult, DubbingCancelResult } from '@/types/domain';

/** UC18 — học viên/giảng viên kích hoạt lồng tiếng AI cho một bài học. */
export const dubbingApi = {
  activate: (lessonId: number, targetLanguage: string, voiceName?: string | null) =>
    api.post<DubbingActivateResult>(
      `/api/v1/lessons/${lessonId}/dubbing`,
      { targetLanguage, voiceName: voiceName ?? undefined },
      { token: getAccessToken() ?? undefined },
    ),
  /** UC20 — huỷ job đang chạy (PENDING/PROCESSING) giữa chừng. */
  cancel: (lessonId: number, targetLanguage: string) =>
    api.post<DubbingCancelResult>(
      `/api/v1/lessons/${lessonId}/dubbing/cancel`,
      { targetLanguage },
      { token: getAccessToken() ?? undefined },
    ),
};
