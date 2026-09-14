import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { wishlistApi } from '@/lib/api/wishlist';
import { ApiError } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

/** Danh sách yêu thích (14/09/2026) — TÍNH NĂNG MỞ RỘNG, không nằm trong 49 use case đặc tả gốc. */
const WISHLIST_QUERY_KEY = ['wishlist'] as const;

export function useWishlist() {
  return useQuery({
    queryKey: WISHLIST_QUERY_KEY,
    queryFn: () => wishlistApi.list(),
    enabled: !!getAccessToken(),
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: number) => wishlistApi.add(courseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Không thêm được vào danh sách yêu thích, thử lại sau.');
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: number) => wishlistApi.remove(courseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Không xoá được khỏi danh sách yêu thích, thử lại sau.');
    },
  });
}
