import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { voiceMappingsApi } from '@/lib/api/voiceMappings';
import { getAccessToken } from '@/lib/auth/token';
import type { CreateVoiceMappingInput, UpdateVoiceMappingInput } from '@/types/domain';

export function useVoiceMappings() {
  return useQuery({
    queryKey: ['voice-mappings'],
    queryFn: () => voiceMappingsApi.list(),
    enabled: !!getAccessToken(),
  });
}

export function useCreateVoiceMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVoiceMappingInput) => voiceMappingsApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['voice-mappings'] }),
  });
}

export function useUpdateVoiceMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateVoiceMappingInput }) =>
      voiceMappingsApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['voice-mappings'] }),
  });
}

export function useDeleteVoiceMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => voiceMappingsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['voice-mappings'] }),
  });
}
