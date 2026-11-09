import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { CreateVoiceMappingInput, UpdateVoiceMappingInput, VoiceMapping } from '@/types/domain';

/** UC47 — Admin only. */
export const voiceMappingsApi = {
  list: () => api.get<VoiceMapping[]>('/api/v1/admin/voice-mappings', { token: getAccessToken() ?? undefined }),

  create: (input: CreateVoiceMappingInput) =>
    api.post<VoiceMapping>('/api/v1/admin/voice-mappings', input, { token: getAccessToken() ?? undefined }),

  update: (id: number, input: UpdateVoiceMappingInput) =>
    api.put<VoiceMapping>(`/api/v1/admin/voice-mappings/${id}`, input, { token: getAccessToken() ?? undefined }),

  remove: (id: number) =>
    api.delete<void>(`/api/v1/admin/voice-mappings/${id}`, { token: getAccessToken() ?? undefined }),
};
