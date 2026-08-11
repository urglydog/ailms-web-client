import { useMutation } from '@tanstack/react-query';
import { dubbingApi } from '@/lib/api/dubbing';

/** UC18 — kích hoạt lồng tiếng AI. `CREATED`/`PROCESSING` → subscribe WebSocket (Giai đoạn F5.3). */
export function useActivateDubbing() {
  return useMutation({
    mutationFn: ({ lessonId, targetLanguage }: { lessonId: number; targetLanguage: string }) =>
      dubbingApi.activate(lessonId, targetLanguage),
  });
}
