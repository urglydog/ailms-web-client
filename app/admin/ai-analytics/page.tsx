'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ChartCard, Delta } from '@/components/charts/ChartCard';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { ListSearch } from '@/components/ui/ListSearch';
import { Pager } from '@/components/ui/SearchPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { api, ApiError } from '@/lib/api/client';
import { aiFeatureLabel, usd, vnd, type AiBillingEntry, type AiUsageOverview } from '@/lib/aiUsage';
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

/**
 * Chi phí AI (21/11/2026): theo dõi tiền chi cho khóa API Gemini/Groq. Mọi lệnh gọi AI được ghi số token thật (kể cả token suy nghĩ) rồi quy đổi bằng đơn giá cấu hình, nên đây là
 * số ƯỚC TÍNH theo token — sát hóa đơn nhà cung cấp hơn nhiều so với trước nhưng không khớp tuyệt đối. Mỗi biểu đồ trả lời một câu hỏi: tiền đang tăng hay giảm, tính năng nào tốn nhất,
 * ai dùng nhiều nhất.
 */
export default function AiAnalyticsPage() {
  const palette = useThemeColors();
  const t = useTranslations('admin.aiAnalytics');
  const locale = useLocale();
  const queryClient = useQueryClient();

  const [from, setFrom] = useState(() => isoDay(new Date(Date.now() - 29 * 86_400_000)));
  const [to, setTo] = useState(() => isoDay(new Date()));
  const [feature, setFeature] = useState('');
  const [lockedOnly, setLockedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(0);
  const validRange = !!from && !!to && from <= to;
  const enabled = !!getAccessToken() && validRange;

  const rangeParams = new URLSearchParams({ from, to });
  if (feature) rangeParams.set('feature', feature);
  const params = new URLSearchParams({ from, to, lockedOnly: String(lockedOnly), page: String(page), size: String(PAGE_SIZE) });
  if (feature) params.set('feature', feature);
  if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());

  const { data: overview, isLoading } = useQuery({
    queryKey: ['admin-ai-overview', from, to, feature],
    queryFn: () => api.get<AiUsageOverview>(`/api/v1/admin/ai-usage/overview?${rangeParams.toString()}`, { token: getAccessToken() ?? undefined }),
    enabled,
    placeholderData: (prev) => prev,
  });
  const { data: usagePage } = useQuery({
    queryKey: ['admin-ai-usage', from, to, feature, lockedOnly, debouncedSearch, page],
    queryFn: () => api.get<AiUsagePage>(`/api/v1/admin/ai-usage?${params.toString()}`, { token: getAccessToken() ?? undefined }),
    enabled,
    placeholderData: (prev) => prev,
  });
  const { data: features } = useQuery({
    queryKey: ['admin-ai-usage-features'],
    queryFn: () => api.get<string[]>('/api/v1/admin/ai-usage/features', { token: getAccessToken() ?? undefined }),
    enabled: !!getAccessToken(),
    staleTime: 10 * 60 * 1000,
  });

  const toggleLockMutation = useMutation({
    mutationFn: (variables: { userId: number; isLocked: boolean }) =>
      api.put(`/api/v1/admin/users/${variables.userId}/toggle-ai-lock?isLocked=${variables.isLocked}`, undefined, { token: getAccessToken() ?? undefined }),
    onSuccess: () => {
      toast.success(t('updated'));
      queryClient.invalidateQueries({ queryKey: ['admin-ai-usage'] });
    },
    onError: (err: Error) => toast.error(err.message || t('error')),
  });

  const usageData = usagePage?.items;
  const totalPages = usagePage ? Math.max(1, Math.ceil(usagePage.total / PAGE_SIZE)) : 1;
  const rate = overview?.usdToVnd ?? 25_500;
  const pieColors = [palette.accent, palette.success, palette.warning, palette.cyan, palette.danger, palette.star, palette.lineDot, palette.accentDark];

  // Dữ liệu biểu đồ cột xếp chồng: mỗi ngày một cột, mỗi tính năng một màu.
  const featureKeys = (overview?.byFeature ?? []).map((f) => f.feature);
  const dailyRows = (() => {
    const byDay = new Map<string, Record<string, number | string>>();
    for (const d of overview?.daily ?? []) {
      const row = byDay.get(d.day) ?? { day: d.day };
      row[d.feature] = Number(d.costUsd);
      byDay.set(d.day, row);
    }
    return [...byDay.values()];
  })();
  const donut = (overview?.byFeature ?? []).map((f) => ({ name: aiFeatureLabel(f.feature), value: Number(f.costUsd) }));
  const topFeature = overview?.byFeature[0];
  const totalCost = Number(overview?.totals.costUsd ?? 0);
  const inputCls = 'rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent';
  const th = 'px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted';

  return (
    <>
      <PageHeader title={t('title')} subtitle="Theo dõi chi phí ước tính của các khóa API AI (Gemini, Groq) theo từng tính năng và người dùng." />

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface-raised p-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">Từ ngày</span>
          <input type="date" value={from} max={to} onChange={(e) => { setFrom(e.target.value); setPage(0); }} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">Đến ngày</span>
          <input type="date" value={to} min={from} onChange={(e) => { setTo(e.target.value); setPage(0); }} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">Tính năng AI</span>
          <select value={feature} onChange={(e) => { setFeature(e.target.value); setPage(0); }} className={inputCls}>
            <option value="">Tất cả tính năng</option>
            {(features ?? []).map((f) => (
              <option key={f} value={f}>{aiFeatureLabel(f)}</option>
            ))}
          </select>
        </label>
      </div>
      {!validRange && <p role="alert" className="m-0 text-sm font-semibold text-danger">Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.</p>}

      {overview?.partialCoverage && (
        <p role="status" className="m-0 rounded-xl border border-warning bg-surface-raised p-4 text-sm text-ink">
          Hệ thống ghi chi phí đầy đủ của mọi tính năng từ ngày {new Date(overview.trackingSince).toLocaleDateString('vi-VN')}. Trước ngày đó, phần Flashcard, Sơ đồ tư duy và Quiz là số ghi nhận thật, còn Lồng tiếng và Gia sư AI là số ước tính từ dữ liệu đã lưu (chỉ tính phần nhìn thấy được, chưa gồm token suy nghĩ và các lần gọi thử), nên tổng của khoảng này thấp hơn thực tế. Hãy xem mục “Đối soát với hóa đơn” bên dưới để biết phần chênh.
        </p>
      )}

      {isLoading && !overview ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface-raised p-4 shadow-sm">
              <span className="text-xs font-semibold text-ink-muted">Chi phí ước tính</span>
              <span className="font-display text-xl font-bold text-ink">{vnd(totalCost, rate)}</span>
              <span className="text-xs text-ink-muted">{usd(totalCost)} · tỷ giá {rate.toLocaleString('vi-VN')}đ/USD</span>
              <Delta current={totalCost} previous={Number(overview.previous.costUsd)} upIsGood={false} />
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface-raised p-4 shadow-sm">
              <span className="text-xs font-semibold text-ink-muted">Số lệnh gọi AI</span>
              <span className="font-display text-xl font-bold text-ink">{overview.totals.requests.toLocaleString('vi-VN')}</span>
              <Delta current={overview.totals.requests} previous={overview.previous.requests} upIsGood={false} />
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface-raised p-4 shadow-sm">
              <span className="text-xs font-semibold text-ink-muted">Tổng token</span>
              <span className="font-display text-xl font-bold text-ink">{overview.totals.tokens.toLocaleString('vi-VN')}</span>
              <Delta current={overview.totals.tokens} previous={overview.previous.tokens} upIsGood={false} />
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface-raised p-4 shadow-sm">
              <span className="text-xs font-semibold text-ink-muted">Âm thanh đã nhận dạng (Groq)</span>
              <span className="font-display text-xl font-bold text-ink">{(overview.totals.audioSeconds / 3600).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} giờ</span>
              <span className="text-xs text-ink-muted">Tính theo giờ âm thanh, không theo token</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartCard
              className="xl:col-span-2"
              question="Chi phí AI mỗi ngày là bao nhiêu và đến từ tính năng nào?"
              insight={topFeature ? `Tốn nhất: ${aiFeatureLabel(topFeature.feature)} (${vnd(Number(topFeature.costUsd), rate)}, ${totalCost > 0 ? Math.round((Number(topFeature.costUsd) / totalCost) * 100) : 0}% tổng chi phí).` : undefined}
            >
              {dailyRows.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-ink-muted">{t('noDaily')}</p>
              ) : (
                <div role="img" aria-label="Biểu đồ cột xếp chồng chi phí AI theo ngày và tính năng" className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyRows} margin={{ left: 4, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={palette.lineSoft} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: palette.inkMuted }} />
                      <YAxis tick={{ fontSize: 11, fill: palette.inkMuted }} tickFormatter={(v: number) => `${Math.round(v * rate / 1000)}k`} width={48} />
                      <Tooltip formatter={(v, name) => [vnd(Number(v), rate), aiFeatureLabel(String(name))]} />
                      <Legend formatter={(v) => aiFeatureLabel(String(v))} />
                      {featureKeys.map((k, i) => (
                        <Bar key={k} dataKey={k} stackId="cost" fill={pieColors[i % pieColors.length]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard question="Tính năng nào chiếm nhiều chi phí nhất?" insight={donut.length > 1 ? 'Phần lớn chi phí tập trung ở vài tính năng đầu — kiểm soát các tính năng này trước.' : undefined}>
              {donut.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-ink-muted">Chưa có dữ liệu.</p>
              ) : (
                <div role="img" aria-label="Biểu đồ tròn tỷ trọng chi phí AI theo tính năng" className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donut} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={2}>
                        {donut.map((e, i) => (
                          <Cell key={e.name} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => vnd(Number(v), rate)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>
        </>
      ) : null}

      <BillingPanel overview={overview} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 font-display text-base font-bold text-ink">Ai dùng AI nhiều nhất?</h2>
          <div className="flex flex-wrap items-center gap-3">
            <ListSearch label="Tìm người dùng" value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Email, tên hoặc ID người dùng..." />
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={lockedOnly} onChange={(e) => { setLockedOnly(e.target.checked); setPage(0); }} className="h-4 w-4 accent-accent" />
              Chỉ người đang bị khóa AI
            </label>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-line bg-surface-raised shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line-soft">
              <thead className="bg-surface">
                <tr>
                  <th scope="col" className={th}>{t('cols.email')}</th>
                  <th scope="col" className={th}>{t('cols.status')}</th>
                  <th scope="col" className={th}>{t('cols.tokens')}</th>
                  <th scope="col" className={th}>Chi phí ước tính</th>
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
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-ink">
                      {vnd(row.totalCost, rate)} <span className="font-normal text-ink-muted">({usd(row.totalCost)})</span>
                    </td>
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
        <p className="m-0 text-xs text-ink-muted">Bảng này chỉ gồm các lệnh gọi AI gắn với một người dùng cụ thể; các chi phí hệ thống (nhúng dữ liệu, tìm kiếm của khách...) nằm trong tổng chi phí ở trên.</p>
      </section>
    </>
  );
}

/** Đối soát với hóa đơn thực tế của Google AI Studio: admin nhập số tiền theo kỳ (không sửa/xóa, không chồng lấn); hệ thống so với phần đã quy được từ token và nêu phần chưa quy được. */
function BillingPanel({ overview }: { overview?: AiUsageOverview }) {
  const queryClient = useQueryClient();
  const token = getAccessToken() ?? undefined;
  const { data: entries } = useQuery({
    queryKey: ['admin-ai-billing'],
    queryFn: () => api.get<AiBillingEntry[]>('/api/v1/admin/ai-usage/billing', { token }),
    enabled: !!token,
  });
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const amountOk = /^\d{1,12}$/.test(amount.trim());
  const canSave = !!start && !!end && start <= end && amountOk;

  const add = useMutation({
    mutationFn: () =>
      api.post('/api/v1/admin/ai-usage/billing', { periodStart: start, periodEnd: end, amountVnd: Number(amount), source: 'Google AI Studio', note: note.trim() || null }, { token }),
    onSuccess: () => {
      toast.success('Đã lưu hóa đơn.');
      setStart('');
      setEnd('');
      setAmount('');
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['admin-ai-billing'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ai-overview'] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không lưu được hóa đơn. Vui lòng thử lại sau.'),
  });

  const rec = overview?.reconciliation;
  const inputCls = 'rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent';
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-4 shadow-sm" aria-label="Đối soát với hóa đơn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 font-display text-base font-bold text-ink">Đối soát với hóa đơn</h2>
          <p className="m-0 mt-1 text-xs text-ink-muted">So chi phí ước tính từ token với số tiền Google AI Studio thực thu (nhập theo kỳ từ trang Usage của dự án). Chỉ gồm Gemini; Groq thanh toán riêng.</p>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-accent-dark hover:bg-tint">
          {open ? 'Đóng' : 'Nhập hóa đơn'}
        </button>
      </div>

      {rec ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-surface p-3">
            <div className="text-xs font-semibold text-ink-muted">Hóa đơn thực tế</div>
            <div className="font-display text-lg font-bold text-ink">{rec.billedVnd.toLocaleString('vi-VN')}đ</div>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <div className="text-xs font-semibold text-ink-muted">Đã quy được theo tính năng</div>
            <div className="font-display text-lg font-bold text-ink">{rec.trackedVnd.toLocaleString('vi-VN')}đ</div>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <div className="text-xs font-semibold text-ink-muted">Chưa quy được</div>
            <div className="font-display text-lg font-bold text-warning">{rec.unexplainedVnd.toLocaleString('vi-VN')}đ</div>
            <div className="text-xs text-ink-muted">{rec.billedVnd > 0 ? Math.round((rec.unexplainedVnd / rec.billedVnd) * 100) : 0}% hóa đơn</div>
          </div>
        </div>
      ) : (
        <p className="m-0 text-sm text-ink-muted">Chưa có hóa đơn nào nằm trọn trong khoảng ngày đang xem. Chọn khoảng ngày bao trọn một kỳ hóa đơn đã nhập để xem đối soát.</p>
      )}
      {rec && rec.unexplainedVnd > 0 && (
        <p className="m-0 text-xs text-ink-muted">
          Phần chưa quy được thường đến từ token suy nghĩ ẩn, các lần chạy thử hoặc thất bại, hoặc tính năng chưa được ghi nhận (phiên học trực tiếp, tìm kiếm có Google Search). Từ ngày ghi nhận đầy đủ, phần này sẽ nhỏ dần.
        </p>
      )}

      {open && (
        <div className="flex flex-col gap-3 border-t border-line pt-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink-muted">Từ ngày</span>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink-muted">Đến ngày</span>
              <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink-muted">Số tiền (đồng)</span>
              <input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Ví dụ 220739"
                className={`${inputCls} w-40 text-right`}
              />
            </label>
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
              <span className="text-xs font-semibold text-ink-muted">Ghi chú (không bắt buộc)</span>
              <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} className={inputCls} />
            </label>
            <button
              type="button"
              disabled={!canSave || add.isPending}
              onClick={() => add.mutate()}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Lưu hóa đơn
            </button>
          </div>
          <p className="m-0 text-xs text-ink-muted">Mỗi kỳ chỉ nhập một lần và không được trùng ngày với kỳ đã nhập. Hóa đơn đã lưu không sửa hoặc xóa được, để số liệu đối soát luôn đáng tin.</p>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
            {(entries ?? []).map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2">
                <span className="text-ink">
                  {new Date(e.periodStart).toLocaleDateString('vi-VN')} – {new Date(e.periodEnd).toLocaleDateString('vi-VN')} · {e.source}
                  {e.note ? <span className="text-ink-muted"> · {e.note}</span> : null}
                </span>
                <span className="font-semibold text-ink">{e.amountVnd.toLocaleString('vi-VN')}đ</span>
              </li>
            ))}
            {(entries ?? []).length === 0 && <li className="text-ink-muted">Chưa có hóa đơn nào.</li>}
          </ul>
        </div>
      )}
    </section>
  );
}
