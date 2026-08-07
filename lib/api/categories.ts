import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/domain';

/** Public — không cần token, dùng chung cho dropdown Instructor lẫn bộ lọc công khai. */
export const categoriesApi = {
  list: () => api.get<Category[]>('/api/v1/categories'),

  create: (input: CreateCategoryInput) =>
    api.post<Category>('/api/v1/categories', input, { token: getAccessToken() ?? undefined }),

  update: (id: number, input: UpdateCategoryInput) =>
    api.put<Category>(`/api/v1/categories/${id}`, input, { token: getAccessToken() ?? undefined }),

  remove: (id: number) =>
    api.delete<void>(`/api/v1/categories/${id}`, { token: getAccessToken() ?? undefined }),
};
