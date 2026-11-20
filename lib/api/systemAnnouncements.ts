import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { CreateSystemAnnouncementReq, SystemAnnouncement, SystemAnnouncementBanner } from '@/types/domain';

/** Thông báo hệ thống từ Admin (26/09/2026, tính năng mới) — phát tán qua job nền Redis phía
 * backend (`SystemAnnouncementService`), 2 endpoint tạo/liệt kê chỉ dành cho Admin. */
export const systemAnnouncementsApi = {
  create: (req: CreateSystemAnnouncementReq) =>
    api.post<SystemAnnouncement>('/api/v1/admin/announcements', req, { token: getAccessToken() ?? undefined }),

  /** Lịch sử cho admin: tìm theo tiêu đề/nội dung, lấy {@code size} dòng đầu (tăng size để xem thêm). */
  list: (q = '', size = 10) => {
    const p = new URLSearchParams({ page: '0', size: String(size) });
    if (q.trim()) p.set('q', q.trim());
    return api.get<SystemAnnouncement[]>(`/api/v1/admin/announcements?${p.toString()}`, { token: getAccessToken() ?? undefined });
  },

  /** Sửa nội dung (cả thông báo đã gửi tới người dùng). */
  update: (id: number, req: { title: string; content: string; expiresAt: string | null }) =>
    api.put<SystemAnnouncement>(`/api/v1/admin/announcements/${id}`, req, { token: getAccessToken() ?? undefined }),

  /** Thu hồi: ẩn khỏi người dùng, giữ bản ghi. */
  revoke: (id: number) =>
    api.post<SystemAnnouncement>(`/api/v1/admin/announcements/${id}/revoke`, {}, { token: getAccessToken() ?? undefined }),

  /** Public — không cần đăng nhập, banner "Bảo trì hệ thống" phải hiện được cho khách vãng lai.
   * Trả về `undefined` khi không có banner nào đang hoạt động (backend trả 200 rỗng thân). */
  getActiveBanner: () => api.get<SystemAnnouncementBanner | undefined>('/api/v1/system-announcements/banner'),
};
