import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { LiveViewDetail, LiveViewSummary } from '@/types/domain';

/**
 * UC51 — xem phiên Live. PUBLIC endpoint (BE tự lọc quyền theo BR-LIVE-01) — Guest gọi được,
 * vẫn truyền token nếu có để BE biết caller là ai (Student đã ghi danh hay chưa, Admin, giảng
 * viên sở hữu...), không phải bắt buộc như các API `mine` khác.
 */
export const liveViewApi = {
  listForCourse: (courseId: number) =>
    api.get<LiveViewSummary[]>(`/api/v1/courses/${courseId}/live-sessions`, {
      token: getAccessToken() ?? undefined,
    }),

  view: (sessionId: number) =>
    api.get<LiveViewDetail>(`/api/v1/live-sessions/${sessionId}/view`, {
      token: getAccessToken() ?? undefined,
    }),
};
