'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import { COLORS } from '@/lib/theme/colors';

interface AiUsageSummary {
  userId: number;
  email: string;
  isAiLocked: boolean;
  totalTokens: number;
  totalCost: number;
}

interface AiUsageDaily {
  day: string;
  totalTokens: number;
  totalCost: number;
}

/** Thống kê dùng AI: biểu đồ chi phí 30 ngày và bảng tiêu thụ theo học viên, có nút khóa/mở khóa quyền dùng AI. */
export default function AiAnalyticsPage() {
  const t = useTranslations('admin.aiAnalytics');
  const locale = useLocale();
  const queryClient = useQueryClient();

  const { data: usageData, isLoading } = useQuery({
    queryKey: ['admin-ai-usage'],
    queryFn: () => api.get<AiUsageSummary[]>('/api/v1/admin/ai-usage', { token: getAccessToken() ?? undefined }),
    enabled: !!getAccessToken(),
  });

  const { data: dailyData } = useQuery({
    queryKey: ['admin-ai-usage-daily'],
    queryFn: () => api.get<AiUsageDaily[]>('/api/v1/admin/ai-usage/daily', { token: getAccessToken() ?? undefined }),
    enabled: !!getAccessToken(),
  });

  const toggleLockMutation = useMutation({
    mutationFn: (variables: { userId: number; isLocked: boolean }) =>
      api.put(`/api/v1/admin/users/${variables.userId}/toggle-ai-lock?isLocked=${variables.isLocked}`, undefined, {
        token: getAccessToken() ?? undefined,
      }),
    onSuccess: () => {
      toast.success(t('updated'));
      queryClient.invalidateQueries({ queryKey: ['admin-ai-usage'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || t('error'));
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const th = 'px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted';

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <section aria-labelledby="ai-cost-title" className="rounded-xl border border-line bg-white p-6 shadow-sm">
        <h2 id="ai-cost-title" className="m-0 mb-4 text-sm font-semibold text-ink">
          {t('chartTitle')}
        </h2>
        {dailyData && dailyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.lineSoft} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v.toFixed(2)}`} />
              <Tooltip
                formatter={(value) => [`$${Number(value ?? 0).toFixed(4)}`, t('cost')]}
                labelFormatter={(label) => t('day', { date: String(label ?? '') })}
              />
              <Area type="monotone" dataKey="totalCost" stroke={COLORS.accent} fill={COLORS.accent} fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-8 text-center text-sm text-ink-muted">{t('noDaily')}</div>
        )}
      </section>

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line-soft">
            <thead className="bg-surface">
              <tr>
                <th scope="col" className={th}>{t('cols.email')}</th>
                <th scope="col" className={th}>{t('cols.status')}</th>
                <th scope="col" className={th}>{t('cols.tokens')}</th>
                <th scope="col" className={th}>{t('cols.cost')}</th>
                <th scope="col" className={`${th} text-right`}>{t('cols.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft bg-white">
              {usageData?.map((row: AiUsageSummary) => (
                <tr key={row.userId} className="transition-colors hover:bg-surface">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-ink">{row.email}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {row.isAiLocked ? (
                      <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-danger ring-1 ring-inset ring-danger/40">{t('locked')}</span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-success-tint px-2 py-1 text-xs font-medium text-success-ink">{t('active')}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-ink-muted">{row.totalTokens.toLocaleString(locale)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-ink">${row.totalCost.toFixed(4)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => toggleLockMutation.mutate({ userId: row.userId, isLocked: !row.isAiLocked })}
                      disabled={toggleLockMutation.isPending}
                      aria-label={`${row.isAiLocked ? t('unlock') : t('lock')}: ${row.email}`}
                      className={`inline-flex items-center rounded-md bg-white px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-inset disabled:opacity-50 ${
                        row.isAiLocked ? 'text-ink ring-line hover:bg-surface' : 'text-danger ring-danger/40 hover:bg-danger/5'
                      }`}
                    >
                      {row.isAiLocked ? t('unlock') : t('lock')}
                    </button>
                  </td>
                </tr>
              ))}
              {(!usageData || usageData.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-ink-muted">
                    {t('empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
