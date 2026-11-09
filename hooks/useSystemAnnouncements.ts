import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { systemAnnouncementsApi } from '@/lib/api/systemAnnouncements';
import type { CreateSystemAnnouncementReq } from '@/types/domain';

export function useSystemAnnouncements() {
  return useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: systemAnnouncementsApi.listAll,
  });
}

export function useCreateSystemAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateSystemAnnouncementReq) => systemAnnouncementsApi.create(req),
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
