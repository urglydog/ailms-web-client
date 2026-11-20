import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { bundlesApi } from '@/lib/api/bundles';
import { getAccessToken } from '@/lib/auth/token';
import type { CreateBundleReq, UpdateBundleReq } from '@/types/domain';

const MY_BUNDLES_KEY = ['bundles', 'mine'] as const;

export function useMyBundles(page = 0, size = 10) {
  return useQuery({
    queryKey: [...MY_BUNDLES_KEY, page, size],
    queryFn: () => bundlesApi.listMine(page, size),
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

export function useDeleteBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bundlesApi.remove(id),
    onSuccess: (res) => {
      toast.success(res.deleted ? 'Đã xóa gói khóa học.' : 'Gói này đã có người mua nên được lưu trữ: ngừng bán và ẩn khỏi danh sách, lịch sử đơn vẫn được giữ nguyên.');
      void queryClient.invalidateQueries({ queryKey: MY_BUNDLES_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Không xóa được gói khóa học. Vui lòng thử lại.');
    },
  });
}
