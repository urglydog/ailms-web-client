import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { CartItem } from '@/types/domain';

/** Giỏ hàng (06/09/2026) — TÍNH NĂNG MỞ RỘNG, không nằm trong 49 use case đặc tả gốc của đồ
 * án. Chỉ khóa học TRẢ PHÍ mới thêm được vào giỏ — khóa miễn phí ghi danh thẳng qua
 * `enrollmentsApi.enrollFree` (UC12), không đi qua giỏ hàng. */
export const cartApi = {
  list: () => api.get<CartItem[]>('/api/v1/cart', { token: getAccessToken() ?? undefined }),

  add: (courseId: number) =>
    api.post<CartItem>('/api/v1/cart/items', { courseId }, { token: getAccessToken() ?? undefined }),

  remove: (courseId: number) =>
    api.delete<void>(`/api/v1/cart/items/${courseId}`, { token: getAccessToken() ?? undefined }),
};
