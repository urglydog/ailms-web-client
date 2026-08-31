import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { liveApi } from '@/lib/api/live';
import { getAccessToken } from '@/lib/auth/token';
import type { CreateLiveSessionInput } from '@/types/domain';

const LIVE_SESSIONS_KEY = ['live-sessions', 'mine'] as const;

export function useMyLiveSessions() {
  return useQuery({
    queryKey: LIVE_SESSIONS_KEY,
    queryFn: () => liveApi.listMine(),
    enabled: !!getAccessToken(),
  });
}

export function useLiveSession(sessionId: number | undefined) {
  return useQuery({
    queryKey: ['live-sessions', sessionId],
    queryFn: () => liveApi.getOwned(sessionId as number),
    enabled: !!sessionId && !!getAccessToken(),
  });
}

export function useCreateLiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLiveSessionInput) => liveApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIVE_SESSIONS_KEY }),
  });
}

export function useStartLiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: number) => liveApi.start(sessionId),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: LIVE_SESSIONS_KEY });
      queryClient.invalidateQueries({ queryKey: ['live-sessions', sessionId] });
    },
  });
}

export function useEndLiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: number) => liveApi.end(sessionId),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: LIVE_SESSIONS_KEY });
      queryClient.invalidateQueries({ queryKey: ['live-sessions', sessionId] });
    },
  });
}
