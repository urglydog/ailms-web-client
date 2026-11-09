import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { bundlesApi } from '@/lib/api/bundles';
import { getAccessToken } from '@/lib/auth/token';
import type { CreateBundleReq, UpdateBundleReq } from '@/types/domain';

const MY_BUNDLES_KEY = ['bundles', 'mine'] as const;

export function useMyBundles(page = 0) {
  return useQuery({
    queryKey: [...MY_BUNDLES_KEY, page],
    queryFn: () => bundlesApi.listMine(page),
    enabled: !!getAccessToken(),
  });
}

export function useCreateBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateBundleReq) => bundlesApi.create(req),
    onSuccess: () => {
      toast.success('Đã tạo gói khóa học thành công');
      void queryClient.invalidateQueries({ queryKey: MY_BUNDLES_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Không tạo được gói khóa học');
    },
  });
}

export function useUpdateBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: UpdateBundleReq }) => bundlesApi.update(id, req),
    onSuccess: () => {
      toast.success('Đã cập nhật gói khóa học');
      void queryClient.invalidateQueries({ queryKey: MY_BUNDLES_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Không cập nhật được gói khóa học');
    },
  });
}

export function useBundlesForCourse(courseId: number | undefined) {
  return useQuery({
    queryKey: ['bundles', 'course', courseId],
    queryFn: () => bundlesApi.getForCourse(courseId!),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });
}
