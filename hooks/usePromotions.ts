import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { instructorPromotionsApi } from '@/lib/api/promotions';
import { getAccessToken } from '@/lib/auth/token';
import type { CreatePromotionReq } from '@/types/promotion';

const KEY = ['instructor', 'promotions'] as const;

export function useMyPromotions() {
  return useQuery({ queryKey: KEY, queryFn: () => instructorPromotionsApi.list(), enabled: !!getAccessToken() });
}

export function useRequestPromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreatePromotionReq) => instructorPromotionsApi.request(req),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCancelPromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => instructorPromotionsApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
