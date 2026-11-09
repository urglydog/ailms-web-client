import { useQuery } from '@tanstack/react-query';
import { voiceOptionsApi } from '@/lib/api/voiceOptions';

/** UC20 mở rộng — danh mục ngôn ngữ/giọng đọc, hiếm đổi nên cache dài (10 phút). */
export function useVoiceOptions() {
  return useQuery({
    queryKey: ['voice-options'],
    queryFn: voiceOptionsApi.getAll,
    staleTime: 10 * 60 * 1000,
  });
}
