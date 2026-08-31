import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { liveLanguageTrackApi } from '@/lib/api/liveLanguageTrack';
import type { ActivateLiveLanguageTrackInput } from '@/types/domain';

const tracksKey = (sessionId: number) => ['live-language-tracks', sessionId] as const;

/** Badge "N người nghe" cần cập nhật gần-thời-gian-thực nhưng không cần WebSocket riêng cho
 * việc này — poll 5s là đủ mượt, tránh phải dựng thêm kênh realtime chỉ để đếm số. */
export function useLiveLanguageTracks(sessionId: number | undefined) {
  return useQuery({
    queryKey: tracksKey(sessionId as number),
    queryFn: () => liveLanguageTrackApi.listActive(sessionId as number),
    enabled: !!sessionId,
    refetchInterval: 5000,
  });
}

function useActivateLiveLanguageTrack(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ActivateLiveLanguageTrackInput) => liveLanguageTrackApi.activate(sessionId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tracksKey(sessionId) }),
  });
}

function useDeactivateLiveLanguageTrack(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetLanguage: string) => liveLanguageTrackApi.deactivate(sessionId, targetLanguage),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tracksKey(sessionId) }),
  });
}

/**
 * Quản lý ngôn ngữ dịch mà NGƯỜI XEM NÀY đang chọn (state cục bộ, mỗi người xem 1 lựa chọn độc
 * lập — BE chỉ đếm activeListenerCount theo lượt activate/deactivate, không hỏi FE ngôn ngữ nào
 * "đang chọn"). Đổi ngôn ngữ tự động deactivate ngôn ngữ cũ trước, rời trang tự động deactivate
 * (BR-LIVE-05 — track chỉ dừng thật khi activeListenerCount về 0).
 */
export function useLiveLanguageSelection(sessionId: number) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const selectedLanguageRef = useRef<string | null>(null);
  const activate = useActivateLiveLanguageTrack(sessionId);
  const deactivate = useDeactivateLiveLanguageTrack(sessionId);

  useEffect(() => {
    selectedLanguageRef.current = selectedLanguage;
  }, [selectedLanguage]);

  // Rời trang (chuyển sang phiên live khác, đóng tab) — dọn đúng ngôn ngữ đang nghe lúc đó.
  // Dùng ref vì cleanup của effect KHÔNG DEPS chỉ chạy 1 lần lúc unmount, đóng lại giá trị
  // `selectedLanguage` CŨ nếu đọc trực tiếp từ state thay vì ref (bug đóng gói kinh điển).
  useEffect(() => {
    return () => {
      if (selectedLanguageRef.current) {
        liveLanguageTrackApi.deactivate(sessionId, selectedLanguageRef.current).catch(() => {
          // Rời trang rồi — không còn ai để báo lỗi, BR-LIVE-09/track cleanup phía server tự lo.
        });
      }
    };
  }, [sessionId]);

  const selectLanguage = useCallback(
    (targetLanguage: string, voiceName?: string) => {
      const previous = selectedLanguageRef.current;
      activate.mutate(
        { targetLanguage, voiceName },
        {
          onSuccess: () => {
            setSelectedLanguage(targetLanguage);
            if (previous && previous !== targetLanguage) {
              deactivate.mutate(previous);
            }
          },
        },
      );
    },
    [activate, deactivate],
  );

  const clearSelection = useCallback(() => {
    const previous = selectedLanguageRef.current;
    if (previous) {
      deactivate.mutate(previous);
      setSelectedLanguage(null);
    }
  }, [deactivate]);

  return {
    selectedLanguage,
    selectLanguage,
    clearSelection,
    isPending: activate.isPending,
    error: activate.error,
  };
}
