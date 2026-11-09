import { api, uploadFile } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { PublicProfile, User } from '@/types/domain';

interface UpdateMyProfileReq {
  fullName?: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  preferredLanguage?: string;
}

interface ChangePasswordReq {
  currentPassword: string;
  newPassword: string;
}

interface UpdatePrivacyReq {
  coursesPublic: boolean;
  wishlistPublic: boolean;
}

/**
 * Hồ sơ cá nhân (14/09/2026, hợp nhất) — trước đây `profile/page.tsx`, `edit-modal.tsx`,
 * `Header.tsx` mỗi nơi tự gọi `fetch()` thô + tự đọc token từ localStorage riêng lẻ, không
 * đồng bộ (đổi avatar ở trang Profile thì Header không tự cập nhật vì Header decode JWT thay
 * vì gọi API). File này là NGUỒN SỰ THẬT DUY NHẤT — mọi nơi đọc/sửa hồ sơ đều qua đây, kèm
 * `hooks/useCurrentUser.ts` cache chung bằng React Query.
 */
export const usersApi = {
  me: () => api.get<User>('/api/v1/users/me', { token: getAccessToken() ?? undefined }),

  updateMe: (req: UpdateMyProfileReq) =>
    api.put<User>('/api/v1/users/me', req, { token: getAccessToken() ?? undefined }),

  changePassword: (req: ChangePasswordReq) =>
    api.put<{ message: string }>('/api/v1/users/me/password', req, { token: getAccessToken() ?? undefined }),

  /** Đổi ảnh đại diện — upload file thật (không còn nhập URL thủ công), cùng khuôn ảnh bìa khóa học. */
  uploadAvatar: (file: File, onProgress?: (percent: number) => void) =>
    uploadFile<User>('/api/v1/users/me/avatar', file, { token: getAccessToken() ?? undefined, onProgress }),

  updatePrivacy: (req: UpdatePrivacyReq) =>
    api.put<User>('/api/v1/users/me/privacy', req, { token: getAccessToken() ?? undefined }),

  /** "View public profile" — public thật sự, không cần token (BE cũng cho phép gọi không JWT). */
  getPublicProfile: (userId: number) => api.get<PublicProfile>(`/api/v1/users/${userId}/public-profile`),
};
