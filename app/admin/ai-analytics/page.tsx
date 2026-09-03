'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import { toast } from 'sonner';

interface AiUsageSummary {
  userId: number;
  email: string;
  isAiLocked: boolean;
  totalTokens: number;
  totalCost: number;
}

export default function AiAnalyticsPage() {
  const queryClient = useQueryClient();

  const { data: usageData, isLoading } = useQuery({
    queryKey: ['admin-ai-usage'],
    queryFn: () =>
      api.get<AiUsageSummary[]>('/api/v1/admin/ai-usage', {
        token: getAccessToken() ?? undefined,
      }),
    enabled: !!getAccessToken(),
  });

  const toggleLockMutation = useMutation({
    mutationFn: (variables: { userId: number; isLocked: boolean }) =>
      api.put(`/api/v1/admin/users/${variables.userId}/toggle-ai-lock?isLocked=${variables.isLocked}`, undefined, {
        token: getAccessToken() ?? undefined,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái AI của người dùng');
      queryClient.invalidateQueries({ queryKey: ['admin-ai-usage'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Có lỗi xảy ra');
    },
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">AI Analytics</h1>
        <p className="mt-2 text-sm text-gray-600">Giám sát lượng tiêu thụ API của học viên và chặn quyền sử dụng AI nếu cần thiết.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Học viên</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái AI</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng Tokens</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng Chi phí ($)</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {usageData?.map((row: AiUsageSummary, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{row.email}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {row.isAiLocked ? (
                      <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Bị khóa</span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Hoạt động</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {row.totalTokens.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-emerald-600">
                    ${row.totalCost.toFixed(4)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button 
                      onClick={() => toggleLockMutation.mutate({ userId: row.userId, isLocked: !row.isAiLocked })}
                      disabled={toggleLockMutation.isPending}
                      className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-inset ${
                        row.isAiLocked 
                          ? 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50' 
                          : 'bg-white text-red-600 ring-red-300 hover:bg-red-50'
                      } disabled:opacity-50`}
                    >
                      {row.isAiLocked ? 'Mở khóa' : 'Khóa AI'}
                    </button>
                  </td>
                </tr>
              ))}
              {(!usageData || usageData.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    Chưa có dữ liệu thống kê
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
