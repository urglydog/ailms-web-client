import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/lib/api/finance';
import { getAccessToken } from '@/lib/auth/token';
import type { LinkPayoutAccountReq } from '@/types/finance';

const KEYS = {
  summary: ['instructor', 'finance', 'summary'],
  ledger: ['instructor', 'finance', 'ledger'],
  banks: ['instructor', 'finance', 'banks'],
  account: ['instructor', 'finance', 'account'],
  payouts: ['instructor', 'finance', 'payouts'],
} as const;

const enabled = () => !!getAccessToken();

export function useFinanceSummary() {
  return useQuery({ queryKey: KEYS.summary, queryFn: () => financeApi.summary(), enabled: enabled() });
}

export function useLedger() {
  return useQuery({ queryKey: KEYS.ledger, queryFn: () => financeApi.ledger(), enabled: enabled() });
}

export function usePayoutBanks() {
  return useQuery({ queryKey: KEYS.banks, queryFn: () => financeApi.banks(), enabled: enabled(), staleTime: 60 * 60 * 1000 });
}

export function useMyPayouts() {
  return useQuery({ queryKey: KEYS.payouts, queryFn: () => financeApi.payouts(), enabled: enabled() });
}

/** Sau mọi thay đổi tiền, làm mới cả số dư, sao kê, lịch sử và tài khoản. */
function useRefreshFinance() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['instructor', 'finance'] });
}

export function useLinkAccount() {
  const refresh = useRefreshFinance();
  return useMutation({
    mutationFn: (req: LinkPayoutAccountReq) => financeApi.linkAccount(req),
    onSuccess: refresh,
  });
}

export function useRequestPayout() {
  const refresh = useRefreshFinance();
  return useMutation({
    mutationFn: (input: { amount: number; idempotencyKey: string }) =>
      financeApi.requestPayout(input.amount, input.idempotencyKey),
    onSuccess: refresh,
  });
}

export function useCancelPayout() {
  const refresh = useRefreshFinance();
  return useMutation({ mutationFn: (id: number) => financeApi.cancelPayout(id), onSuccess: refresh });
}

export function useConfirmFinance() {
  const refresh = useRefreshFinance();
  return useMutation({ mutationFn: (token: string) => financeApi.confirm(token), onSuccess: refresh });
}
