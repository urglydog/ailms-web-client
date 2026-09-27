import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

/** Khớp `NotificationDto.NotificationRes` phía backend — BR-NOTIFY-01 (mọi sự kiện vừa lưu DB
 * vừa bắn WebSocket cùng 1 payload này). */
export interface NotificationRes {
  id: number;
  type: string;
  title: string;
  content: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  listMine: () => api.get<NotificationRes[]>('/api/v1/notifications', { token: getAccessToken() ?? undefined }),
  /** (26/09/2026, sửa lỗi) — trước đây "Đánh dấu đã đọc" chỉ đổi state ở FE, không lưu DB. */
  markAllAsRead: () =>
    api.patch<void>('/api/v1/notifications/read-all', undefined, { token: getAccessToken() ?? undefined }),
  markAsRead: (id: number) =>
    api.patch<void>(`/api/v1/notifications/${id}/read`, undefined, { token: getAccessToken() ?? undefined }),
};
