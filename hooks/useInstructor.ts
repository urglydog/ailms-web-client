import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { authApi } from '@/lib/api/auth';
import { instructorApi, type SubmitVerificationReq } from '@/lib/api/instructor';
import { getAccessToken } from '@/lib/auth/token';

const CURRENT_USER_QUERY_KEY = ['users', 'me'] as const;
const VERIFICATION_STATUS_QUERY_KEY = ['instructor', 'verification', 'status'] as const;

/**
 * "Trở thành Giảng viên" (15/09/2026, thiết kế lại) — nâng role NGAY, không chờ Admin duyệt.
 * Bắt buộc gọi {@link authApi.refresh} ngay sau khi thành công: JWT nhồi role lúc KÝ, không
 * đọc lại DB mỗi request, nên access token cũ vẫn mang role STUDENT tới khi refresh (xem
 * docblock `InstructorController.becomeInstructor`).
 */
export function useBecomeInstructor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await instructorApi.become();
      await authApi.refresh();
    },
    onSuccess: () => {
      toast.success('Chúc mừng! Bạn đã trở thành Giảng viên.');
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Không thể nâng cấp tài khoản, thử lại sau.');
    },
  });
}

/** BR-VERIFY-01 — dùng để quyết định hiện form xác minh hay chặn nút "Gửi duyệt" khóa học đầu tiên. */
export function useInstructorVerificationStatus(enabled: boolean) {
  return useQuery({
    queryKey: VERIFICATION_STATUS_QUERY_KEY,
    queryFn: () => instructorApi.getVerificationStatus(),
    enabled: enabled && !!getAccessToken(),
  });
}

export function useSubmitInstructorVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: SubmitVerificationReq) => instructorApi.submitVerification(req),
    onSuccess: () => {
      toast.success('Đã gửi thông tin xác minh thành công.');
      void queryClient.invalidateQueries({ queryKey: VERIFICATION_STATUS_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Không gửi được thông tin xác minh, thử lại sau.');
    },
  });
}
