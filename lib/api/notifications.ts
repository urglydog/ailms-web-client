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
};
