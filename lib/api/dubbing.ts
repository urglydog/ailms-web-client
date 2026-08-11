import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { DubbingActivateResult } from '@/types/domain';

/** UC18 — học viên/giảng viên kích hoạt lồng tiếng AI cho một bài học. */
export const dubbingApi = {
  activate: (lessonId: number, targetLanguage: string) =>
    api.post<DubbingActivateResult>(
      `/api/v1/lessons/${lessonId}/dubbing`,
      { targetLanguage },
      { token: getAccessToken() ?? undefined },
    ),
};
