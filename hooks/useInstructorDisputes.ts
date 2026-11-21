import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { instructorDisputesApi } from '@/lib/api/disputes';
import { getAccessToken } from '@/lib/auth/token';
import type { InstructorRespondReq } from '@/types/domain';

const KEY = ['instructor', 'disputes'] as const;

/** Khiếu nại/yêu cầu hoàn tiền thuộc các khóa của giảng viên (11/11/2026). */
export function useInstructorDisputes() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => instructorDisputesApi.list(),
    enabled: !!getAccessToken(),
  });
}

export function useAppealDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; reason: string }) => instructorDisputesApi.appeal(input.id, input.reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRespondToDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; req: InstructorRespondReq; files: File[] }) =>
      instructorDisputesApi.respond(input.id, input.req, input.files),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
