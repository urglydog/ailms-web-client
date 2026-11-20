'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { ListSearch } from '@/components/ui/ListSearch';
import { Pager } from '@/components/ui/SearchPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import { useThemeColors } from '@/lib/theme/useThemeColors';

interface AiUsageSummary {
  userId: number;
  email: string;
  isAiLocked: boolean;
  totalTokens: number;
  totalCost: number;
}

interface AiUsagePage {
  items: AiUsageSummary[];
  total: number;
  page: number;
  size: number;
}

const PAGE_SIZE = 10;
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface AiUsageDaily {
  day: string;
  totalTokens: number;
  totalCost: number;
}

/** Thống kê dùng AI: biểu đồ chi phí 30 ngày và bảng tiêu thụ theo học viên, có nút khóa/mở khóa quyền dùng AI. */
export default function AiAnalyticsPage() {
  const palette = useThemeColors();
  const t = useTranslations('admin.aiAnalytics');
  const locale = useLocale();
  const queryClient = useQueryClient();

  // Bộ lọc: khoảng ngày (mặc định 30 ngày gần nhất), tính năng AI, chỉ người đang bị khóa AI, tìm theo email/tên/ID; phân trang phía máy chủ.
  const [from, setFrom] = useState(() => isoDay(new Date(Date.now() - 29 * 86_400_000)));
  const [to, setTo] = useState(() => isoDay(new Date()));
  const [feature, setFeature] = useState('');
  const [lockedOnly, setLockedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(0);
  const validRange = !!from && !!to && from <= to;

  const params = new URLSearchParams({ from, to, lockedOnly: String(lockedOnly), page: String(page), size: String(PAGE_SIZE) });
  if (feature) params.set('feature', feature);
  if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
  const dailyParams = new URLSearchParams({ from, to });
  if (feature) dailyParams.set('feature', feature);

  const { data: usagePage, isLoading } = useQuery({
    queryKey: ['admin-ai-usage', from, to, feature, lockedOnly, debouncedSearch, page],
    queryFn: () => api.get<AiUsagePage>(`/api/v1/admin/ai-usage?${params.toString()}`, { token: getAccessToken() ?? undefined }),
    enabled: !!getAccessToken() && validRange,
    placeholderData: (prev) => prev,
  });
  const usageData = usagePage?.items;
  const totalPages = usagePage ? Math.max(1, Math.ceil(usagePage.total / PAGE_SIZE)) : 1;

  const { data: dailyData } = useQuery({
    queryKey: ['admin-ai-usage-daily', from, to, feature],
    queryFn: () => api.get<AiUsageDaily[]>(`/api/v1/admin/ai-usage/daily?${dailyParams.toString()}`, { token: getAccessToken() ?? undefined }),
    enabled: !!getAccessToken() && validRange,
  });

  const { data: features } = useQuery({
    queryKey: ['admin-ai-usage-features'],
    queryFn: () => api.get<string[]>('/api/v1/admin/ai-usage/features', { token: getAccessToken() ?? undefined }),
    enabled: !!getAccessToken(),
    staleTime: 10 * 60 * 1000,
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

  if (isLoading && !usagePage) {
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

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface-raised p-4">
        <ListSearch label="Tìm người dùng" value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Email, tên hoặc ID người dùng..." className="sm:w-72" />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">Từ ngày</span>
          <input type="date" value={from} max={to} onChange={(e) => { setFrom(e.target.value); setPage(0); }} className="rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">Đến ngày</span>
          <input type="date" value={to} min={from} onChange={(e) => { setTo(e.target.value); setPage(0); }} className="rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">Tính năng AI</span>
          <select value={feature} onChange={(e) => { setFeature(e.target.value); setPage(0); }} className="rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent">
            <option value="">Tất cả tính năng</option>
            {(features ?? []).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-ink">
          <input type="checkbox" checked={lockedOnly} onChange={(e) => { setLockedOnly(e.target.checked); setPage(0); }} className="h-4 w-4 accent-accent" />
          Chỉ người đang bị khóa AI
        </label>
      </div>
      {!validRange && <p role="alert" className="m-0 text-sm font-semibold text-danger">Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.</p>}

      <section aria-labelledby="ai-cost-title" className="rounded-xl border border-line bg-surface-raised p-6 shadow-sm">
        <h2 id="ai-cost-title" className="m-0 mb-4 text-sm font-semibold text-ink">
          {t('chartTitle')}
        </h2>
        {dailyData && dailyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={palette.lineSoft} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: palette.inkMuted }} />
              <YAxis tick={{ fontSize: 11, fill: palette.inkMuted }} tickFormatter={(v: number) => `$${v.toFixed(2)}`} />
              <Tooltip
                formatter={(value) => [`$${Number(value ?? 0).toFixed(4)}`, t('cost')]}
                labelFormatter={(label) => t('day', { date: String(label ?? '') })}
              />
              <Area type="monotone" dataKey="totalCost" stroke={palette.accent} fill={palette.accent} fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-8 text-center text-sm text-ink-muted">{t('noDaily')}</div>
        )}
      </section>

      <div className="overflow-hidden rounded-xl border border-line bg-surface-raised shadow-sm">
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
            <tbody className="divide-y divide-line-soft bg-surface-raised">
              {usageData?.map((row: AiUsageSummary) => (
                <tr key={row.userId} className="transition-colors hover:bg-surface">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-ink">{row.email}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {row.isAiLocked ? (
                      <span className="inline-flex items-center rounded-md bg-surface-raised px-2 py-1 text-xs font-medium text-danger ring-1 ring-inset ring-danger/40">{t('locked')}</span>
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
                      className={`inline-flex items-center rounded-md bg-surface-raised px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-inset disabled:opacity-50 ${
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
        <div className="border-t border-line px-4 py-3">
          <Pager page={page} totalPages={totalPages} total={usagePage?.total ?? 0} onPage={setPage} />
        </div>
      </div>
    </>
  );
}
