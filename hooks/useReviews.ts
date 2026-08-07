import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '@/lib/api/reviews';
import { getAccessToken } from '@/lib/auth/token';
import type { CreateReviewInput } from '@/types/domain';

export function useCourseReviews(courseId: number) {
  return useQuery({
    queryKey: ['reviews', 'course', courseId],
    queryFn: () => reviewsApi.listForCourse(courseId),
  });
}

export function useCreateReview(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => reviewsApi.create(courseId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews', 'course', courseId] }),
  });
}

// ── Admin (UC44) ──

export function useAllReviews(page = 0, size = 20) {
  return useQuery({
    queryKey: ['reviews', 'all', page, size],
    queryFn: () => reviewsApi.listAll(page, size),
    enabled: !!getAccessToken(),
  });
}

export function useHideReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reviewsApi.hide(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews'] }),
  });
}

export function useUnhideReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reviewsApi.unhide(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews'] }),
  });
}
