import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { WishlistItem } from '@/types/domain';

/** Danh sách yêu thích (14/09/2026) — TÍNH NĂNG MỞ RỘNG, không nằm trong 49 use case đặc tả
 * gốc của đồ án. Khác giỏ hàng (`cart.ts`): khóa MIỄN PHÍ vẫn thêm được vào wishlist. */
export const wishlistApi = {
  list: () => api.get<WishlistItem[]>('/api/v1/wishlist', { token: getAccessToken() ?? undefined }),

  add: (courseId: number) =>
    api.post<WishlistItem>('/api/v1/wishlist/items', { courseId }, { token: getAccessToken() ?? undefined }),

  remove: (courseId: number) =>
    api.delete<void>(`/api/v1/wishlist/items/${courseId}`, { token: getAccessToken() ?? undefined }),
};
