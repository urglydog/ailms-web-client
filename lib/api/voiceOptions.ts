import { api } from '@/lib/api/client';
import type { VoiceOption } from '@/types/domain';

/** UC20 mở rộng — danh mục ngôn ngữ + giọng đọc đang hỗ trợ. Public GET, không cần token. */
export const voiceOptionsApi = {
  getAll: () => api.get<VoiceOption[]>('/api/v1/voice-options'),
};
