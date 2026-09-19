import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { authApi } from '@/lib/api/auth';
import { instructorApi, type SubmitVerificationReq } from '@/lib/api/instructor';
import { getAccessToken, getCurrentRole } from '@/lib/auth/token';

const CURRENT_USER_QUERY_KEY = ['users', 'me'] as const;
const VERIFICATION_STATUS_QUERY_KEY = ['instructor', 'verification', 'status'] as const;

/**
 * "Trở thành Giảng viên" (15/09/2026, thiết kế lại) — nâng role NGAY, không chờ Admin duyệt.
 * Bắt buộc gọi {@link authApi.refresh} ngay sau khi thành công: JWT nhồi role lúc KÝ, không
 * đọc lại DB mỗi request, nên access token cũ vẫn mang role STUDENT tới khi refresh (xem
 * docblock `InstructorController.becomeInstructor`).
 *
 * (19/09/2026, sửa lỗi) — `instructorApi.become()` có thể báo lỗi "đã là Giảng viên rồi" ngay
 * cả khi CHÍNH lần gọi trước đó của người dùng đã nâng role thành công (vd. bấm "Hoàn tất" 2
 * lần do bước `refresh()` sau đó bị trục trặc mạng, khiến FE tưởng cả thao tác thất bại). Lỗi
 * đó phản ánh ĐÚNG state ở server (role đã là INSTRUCTOR) nên không nên coi là thất bại — gọi
 * `refresh()` để đọc role thật rồi mới quyết định có ném lỗi tiếp hay không, thay vì tin tưởng
 * tuyệt đối vào kết quả của `become()`.
 */
export function useBecomeInstructor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await instructorApi.become();
      } catch (err) {
        await authApi.refresh();
        if (getCurrentRole() !== 'INSTRUCTOR') throw err;
        return;
      }
      await authApi.refresh();
    },
    onSuccess: () => {
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
      void queryClient.invalidateQueries({ queryKey: VERIFICATION_STATUS_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Không gửi được thông tin xác minh, thử lại sau.');
    },
  });
}
