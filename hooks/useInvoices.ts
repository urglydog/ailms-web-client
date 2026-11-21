import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '@/lib/api/invoices';
import { getAccessToken } from '@/lib/auth/token';

export function useMyInvoices() {
  return useQuery({ queryKey: ['invoices', 'mine'], queryFn: () => invoicesApi.listMine(), enabled: !!getAccessToken() });
}
