import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { liveOriginalSubtitleApi } from '@/lib/api/liveOriginalSubtitle';

/**
 * F11.5 mở rộng — bật/tắt "Phụ đề gốc", ĐỘC LẬP hoàn toàn với việc chọn ngôn ngữ lồng tiếng
 * (khác thiết kế cũ — trước đây phụ đề chỉ hiện được sau khi kích hoạt dịch 1 ngôn ngữ nào đó).
 * Cùng khuôn với `useLiveLanguageSelection` (rời trang tự động tắt qua ref, tránh đóng gói giá
 * trị cũ — xem ghi chú ở đó).
 */
export function useLiveOriginalSubtitle(sessionId: number) {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const activate = useMutation({ mutationFn: () => liveOriginalSubtitleApi.activate(sessionId) });
  const deactivate = useMutation({ mutationFn: () => liveOriginalSubtitleApi.deactivate(sessionId) });

  useEffect(() => {
    return () => {
      if (enabledRef.current) {
        liveOriginalSubtitleApi.deactivate(sessionId).catch(() => {
          // Rời trang rồi — BR-LIVE-09/dọn tài nguyên phía server tự lo.
        });
      }
    };
  }, [sessionId]);

  const toggle = useCallback(
    (next: boolean) => {
      if (next === enabled) return;
      if (next) {
        activate.mutate(undefined, { onSuccess: () => setEnabled(true) });
      } else {
        deactivate.mutate(undefined, { onSuccess: () => setEnabled(false) });
      }
    },
    [enabled, activate, deactivate],
  );

  return { enabled, toggle, isPending: activate.isPending || deactivate.isPending, error: activate.error };
}
