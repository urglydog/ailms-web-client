import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usersApi } from '@/lib/api/users';
import { ApiError } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import { tr } from '@/lib/i18n/translate';

/** Nguồn sự thật duy nhất cho hồ sơ người dùng hiện tại (14/09/2026) — xem `lib/api/users.ts`. */
const CURRENT_USER_QUERY_KEY = ['users', 'me'] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => usersApi.me(),
    enabled: !!getAccessToken(),
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: () => {
      toast.success(tr('errors.toast.user.profileUpdated'));
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : tr('errors.toast.user.profileUpdateFailed'));
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (percent: number) => void }) =>
      usersApi.uploadAvatar(file, onProgress),
    onSuccess: () => {
      toast.success(tr('errors.toast.user.avatarUpdated'));
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : tr('errors.toast.user.avatarUploadFailed'));
    },
  });
}

export function useUpdatePrivacy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updatePrivacy,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : tr('errors.toast.user.updateFailed'));
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: usersApi.changePassword,
  });
}
