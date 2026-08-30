import { useMutation } from '@tanstack/react-query';
import { dubbingApi } from '@/lib/api/dubbing';

/** UC18 — kích hoạt lồng tiếng AI. `CREATED`/`PROCESSING` → subscribe WebSocket (Giai đoạn F5.3). */
export function useActivateDubbing() {
  return useMutation({
    mutationFn: ({
      lessonId,
      targetLanguage,
      voiceName,
    }: {
      lessonId: number;
      targetLanguage: string;
      voiceName?: string | null;
    }) => dubbingApi.activate(lessonId, targetLanguage, voiceName),
  });
}

/** UC20 — huỷ job lồng tiếng đang chạy giữa chừng. */
export function useCancelDubbing() {
  return useMutation({
    mutationFn: ({ lessonId, targetLanguage }: { lessonId: number; targetLanguage: string }) =>
      dubbingApi.cancel(lessonId, targetLanguage),
  });
}
