import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/lib/api/finance';
import { getAccessToken } from '@/lib/auth/token';
import type { EditPayoutAccountReq, LinkPayoutAccountReq } from '@/types/finance';

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

export function useLedger(params: { group?: string; from?: string; to?: string; page?: number } = {}) {
  return useQuery({
    queryKey: [...KEYS.ledger, params],
    queryFn: () => financeApi.ledger(params),
    enabled: enabled(),
    placeholderData: (prev) => prev,
  });
}

export function usePayoutBanks() {
  return useQuery({ queryKey: KEYS.banks, queryFn: () => financeApi.banks(), enabled: enabled(), staleTime: 60 * 60 * 1000 });
}

export function usePayoutAccounts() {
  return useQuery({ queryKey: KEYS.account, queryFn: () => financeApi.accounts(), enabled: enabled() });
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

export function useEditAccount() {
  const refresh = useRefreshFinance();
  return useMutation({
    mutationFn: (input: { id: number; req: EditPayoutAccountReq }) => financeApi.editAccount(input.id, input.req),
    onSuccess: refresh,
  });
}

export function useSetPrimaryAccount() {
  const refresh = useRefreshFinance();
  return useMutation({ mutationFn: (id: number) => financeApi.setPrimaryAccount(id), onSuccess: refresh });
}

export function useRemoveAccount() {
  const refresh = useRefreshFinance();
  return useMutation({ mutationFn: (id: number) => financeApi.removeAccount(id), onSuccess: refresh });
}

export function useChangePayoutAccount() {
  const refresh = useRefreshFinance();
  return useMutation({
    mutationFn: (input: { payoutId: number; accountId: number }) => financeApi.changePayoutAccount(input.payoutId, input.accountId),
    onSuccess: refresh,
  });
}

export function useRequestPayout() {
  const refresh = useRefreshFinance();
  return useMutation({
    mutationFn: (input: { amount: number; idempotencyKey: string; accountId?: number }) =>
      financeApi.requestPayout(input.amount, input.idempotencyKey, input.accountId),
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
