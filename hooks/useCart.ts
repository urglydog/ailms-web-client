import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cartApi } from '@/lib/api/cart';
import { ApiError } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

/** Giỏ hàng (06/09/2026) — TÍNH NĂNG MỞ RỘNG, không nằm trong 49 use case đặc tả gốc. */
const CART_QUERY_KEY = ['cart'] as const;

export function useCart() {
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => cartApi.list(),
    enabled: !!getAccessToken(),
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: number) => cartApi.add(courseId),
    onSuccess: () => {
      toast.success('Đã thêm vào giỏ hàng');
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Không thêm được vào giỏ hàng, thử lại sau.');
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: number) => cartApi.remove(courseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Không xoá được khỏi giỏ hàng, thử lại sau.');
    },
  });
}
