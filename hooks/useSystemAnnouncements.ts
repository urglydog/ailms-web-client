import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { systemAnnouncementsApi } from '@/lib/api/systemAnnouncements';
import type { CreateSystemAnnouncementReq } from '@/types/domain';

export function useSystemAnnouncements(q: string, size: number) {
  return useQuery({
    queryKey: ['admin', 'announcements', q, size],
    queryFn: () => systemAnnouncementsApi.list(q, size),
    placeholderData: (prev) => prev,
  });
}

export function useUpdateSystemAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: { title: string; content: string; expiresAt: string | null } }) => systemAnnouncementsApi.update(id, req),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  });
}

export function useRevokeSystemAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => systemAnnouncementsApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      queryClient.invalidateQueries({ queryKey: ['system-announcements', 'banner'] });
    },
  });
}

export function useCreateSystemAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateSystemAnnouncementReq) => systemAnnouncementsApi.create(req),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  });
}

export function useRestoreSystemAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => systemAnnouncementsApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      queryClient.invalidateQueries({ queryKey: ['system-announcements', 'banner'] });
    },
  });
}

export function useDeleteSystemAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => systemAnnouncementsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  });
}

/** Banner đầu trang — public, poll nhẹ mỗi 5 phút (không cần realtime, "bảo trì hệ thống" không
 * phải thông tin cấp bách tới mức cần WebSocket riêng). */
export function useActiveBanner() {
  return useQuery({
    queryKey: ['system-announcements', 'banner'],
    queryFn: systemAnnouncementsApi.getActiveBanner,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
