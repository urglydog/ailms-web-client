import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { couponsApi } from '@/lib/api/coupons';
import { getAccessToken } from '@/lib/auth/token';
import type { CreateCouponReq, UpdateCouponReq } from '@/types/domain';

const COUPONS_QUERY_KEY = ['coupons', 'mine'] as const;

/**
 * Mã giảm giá kiểu Udemy (15/09/2026, mở rộng — UC55/UC56/UC57). Dùng chung 1 bộ hook cho cả
 * trang Admin lẫn Instructor — backend tự phân quyền theo role đăng nhập (BR-COUPON-02/03/06).
 */
export function useMyCoupons() {
  return useQuery({
    queryKey: COUPONS_QUERY_KEY,
    queryFn: () => couponsApi.listMine(),
    enabled: !!getAccessToken(),
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateCouponReq) => couponsApi.create(req),
    onSuccess: () => {
      toast.success('Đã tạo mã giảm giá');
      void queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Không tạo được mã giảm giá, thử lại sau.');
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: UpdateCouponReq }) => couponsApi.update(id, req),
    onSuccess: () => {
      toast.success('Đã cập nhật mã giảm giá');
      void queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Không cập nhật được mã giảm giá, thử lại sau.');
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => couponsApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xóa mã giảm giá');
      void queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Không xóa được mã giảm giá, thử lại sau.');
    },
  });
}
