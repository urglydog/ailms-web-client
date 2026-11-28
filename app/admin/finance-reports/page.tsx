'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileDown, FileSpreadsheet, FileText, Mail } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { ChartCard, Delta } from '@/components/charts/ChartCard';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiError } from '@/lib/api/client';
import { financeReportsApi } from '@/lib/api/financeReports';
import { getAccessToken } from '@/lib/auth/token';
import { dateTime, money } from '@/lib/finance';
import { saveBlob } from '@/lib/invoices';
import { useThemeColors } from '@/lib/theme/useThemeColors';
import type { ExportFormat, Granularity } from '@/types/financeReport';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86_400_000));
const monthStart = (offset: number) => iso(new Date(new Date().getFullYear(), new Date().getMonth() + offset, 1));
const monthEnd = (offset: number) => iso(new Date(new Date().getFullYear(), new Date().getMonth() + offset + 1, 0));

const GRANS: Granularity[] = ['DAY', 'WEEK', 'MONTH'];
/** Ngưỡng tô đỏ cho khóa học có tỷ lệ hoàn cao (số đơn đủ lớn mới có ý nghĩa). */
const HIGH_REFUND_PCT = 20;
const MIN_ORDERS_FOR_RATE = 3;

function Stat({ label, value, delta, tone }: { label: string; value: string; delta?: React.ReactNode; tone?: 'danger' | 'success' }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface-raised p-4 shadow-sm">
      <span className="text-xs font-semibold text-ink-muted">{label}</span>
      <span className={`font-display text-xl font-bold ${tone === 'danger' ? 'text-danger' : tone === 'success' ? 'text-success-ink' : 'text-ink'}`}>{value}</span>
      {delta}
    </div>
  );
}

/**
 * Thống kê tài chính (20/11/2026): mỗi biểu đồ trả lời một câu hỏi của admin — doanh thu tăng hay giảm, tiền thực về nền tảng, khóa/giảng viên dẫn đầu,
 * khóa nào hoàn tiền nhiều bất thường, doanh thu đến từ đâu, yêu cầu rút nào đang chờ lâu, và chi qua PayOS có khớp sổ sách không. Số liệu do BE tính.
 */
export default function AdminFinanceReportsPage() {
  const t = useTranslations('admin.finance');
  const locale = useLocale();
  const compactFmt = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
  const compact = (v: number) => compactFmt.format(v);
  const label = (group: string, key: string) => (t.has(`${group}.${key}`) ? t(`${group}.${key}`) : key);
  const qc = useQueryClient();
  const palette = useThemeColors();
  const [from, setFrom] = useState(() => monthStart(0));
  const [to, setTo] = useState(() => iso(new Date()));
  const [gran, setGran] = useState<Granularity>('DAY');
  const enabled = !!getAccessToken();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'finance-report', from, to, gran],
    queryFn: () => financeReportsApi.get(from, to, gran),
    enabled: enabled && !!from && !!to && from <= to,
  });
  const { data: snapshots } = useQuery({
    queryKey: ['admin', 'finance-report-snapshots'],
    queryFn: () => financeReportsApi.snapshots(),
    enabled,
  });

  const runNow = useMutation({
    mutationFn: () => financeReportsApi.runNow(from, to),
    onSuccess: (res) => {
      if (res.emailsSent > 0) toast.success(t('toast.emailed'));
      else toast.error(t('toast.noEmail'));
      qc.invalidateQueries({ queryKey: ['admin', 'finance-report-snapshots'] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : t('toast.runError')),
  });

  const download = async (format: ExportFormat) => {
    saveBlob(await financeReportsApi.export(from, to, gran, format), `${t('fileName')}-${from}_${to}.${format}`);
  };

  const preset = (a: string, b: string) => {
    setFrom(a);
    setTo(b);
  };
  const s = data?.summary;
  const prev = data?.previous;
  const rec = data?.reconciliation;
  const inputCls = 'rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent';
  const btnCls = 'rounded-lg border border-line px-3 py-2 text-xs font-semibold text-accent-dark hover:bg-tint';
  const pieColors = [palette.accent, palette.success, palette.warning, palette.cyan, palette.danger, palette.star, palette.lineDot];

  // Dữ liệu biểu đồ
  const split = s
    ? [
        { name: t('split.platform'), value: s.platformFee },
        { name: t('split.instructor'), value: s.instructorEarning },
        { name: t('split.refunded'), value: s.refunds },
      ].filter((x) => x.value > 0)
    : [];
  const sources = (data?.sources ?? []).map((x) => ({
    referral: x.source === 'INSTRUCTOR_REFERRAL',
    name: x.source === 'INSTRUCTOR_REFERRAL' ? t('source.referral') : t('source.organic'),
    value: x.grossRevenue,
    orders: x.orders,
  }));
  const reasons = (data?.refundReasons ?? []).map((x) => ({ name: label('reason', x.reason), value: x.amount, count: x.count }));
  const topCourses = (data?.courses ?? []).slice(0, 8).map((c) => ({ name: c.title.length > 28 ? `${c.title.slice(0, 27)}…` : c.title, full: c.title, value: c.grossRevenue, orders: c.orders }));
  const topInstructors = (data?.instructors ?? []).slice(0, 8).map((i) => ({ name: i.name.length > 24 ? `${i.name.slice(0, 23)}…` : i.name, full: i.name, value: i.grossRevenue, orders: i.orders }));
  const refundRates = (data?.courses ?? [])
    .filter((c) => c.orders >= MIN_ORDERS_FOR_RATE && c.refundedOrders > 0)
    .map((c) => ({ name: c.title.length > 28 ? `${c.title.slice(0, 27)}…` : c.title, full: c.title, pct: Math.round((c.refundedOrders / c.orders) * 1000) / 10, refunded: c.refundedOrders, orders: c.orders }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 8);
  const revenueDelta = s && prev && prev.grossRevenue > 0 ? Math.round(((s.grossRevenue - prev.grossRevenue) / prev.grossRevenue) * 100) : null;

  const tooltipMoney = (v: unknown) => money(Number(v));

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <ExportMenu
            items={[
              { id: 'pdf', label: t('export.pdf'), hint: t('export.pdfHint'), icon: <FileText size={15} aria-hidden />, onSelect: () => download('pdf') },
              { id: 'xlsx', label: t('export.xlsx'), hint: t('export.xlsxHint'), icon: <FileSpreadsheet size={15} aria-hidden />, onSelect: () => download('xlsx') },
              { id: 'csv', label: t('export.csv'), hint: t('export.csvHint'), icon: <FileDown size={15} aria-hidden />, onSelect: () => download('csv') },
              {
                id: 'mail',
                label: t('export.mail'),
                hint: t('export.mailHint'),
                icon: <Mail size={15} aria-hidden />,
                onSelect: async () => {
                  await runNow.mutateAsync();
                },
              },
            ]}
            disabled={!data}
          />
        }
      />

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-line bg-surface-raised p-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">{t('filter.from')}</span>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">{t('filter.to')}</span>
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">{t('filter.group')}</span>
          <select value={gran} onChange={(e) => setGran(e.target.value as Granularity)} className={inputCls}>
            {GRANS.map((g) => (
              <option key={g} value={g}>{t(`gran.${g}`)}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => preset(daysAgo(6), iso(new Date()))} className={btnCls}>{t('filter.last7')}</button>
          <button type="button" onClick={() => preset(daysAgo(29), iso(new Date()))} className={btnCls}>{t('filter.last30')}</button>
          <button type="button" onClick={() => preset(monthStart(0), iso(new Date()))} className={btnCls}>{t('filter.thisMonth')}</button>
          <button type="button" onClick={() => preset(monthStart(-1), monthEnd(-1))} className={btnCls}>{t('filter.lastMonth')}</button>
        </div>
        <Link href="/admin/settings" className="ml-auto text-sm font-semibold text-accent-dark hover:underline">{t('filter.autoConfig')}</Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : isError || !s || !prev || !rec || !data ? (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-6 text-center text-danger">
          {error instanceof ApiError ? error.message : t('loadError')}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t('stat.gross')} value={money(s.grossRevenue)} delta={<Delta current={s.grossRevenue} previous={prev.grossRevenue} />} />
            <Stat label={t('stat.net')} value={money(s.netRevenue)} delta={<Delta current={s.netRevenue} previous={prev.netRevenue} />} />
            <Stat
              label={t('stat.refunds')}
              value={money(s.refunds)}
              tone={s.refundRatePct > prev.refundRatePct && s.refundCount > 0 ? 'danger' : undefined}
              delta={<span className="text-xs text-ink-muted">{t('stat.refundMeta', { count: s.refundCount, pct: s.refundRatePct })} <Delta current={s.refunds} previous={prev.refunds} upIsGood={false} /></span>}
            />
            <Stat label={t('stat.platform')} value={money(s.platformFee)} delta={<Delta current={s.platformFee} previous={prev.platformFee} />} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartCard
              className="xl:col-span-2"
              question={t('trend.q')}
              insight={revenueDelta === null ? undefined : revenueDelta >= 0 ? t('trend.up', { pct: revenueDelta }) : t('trend.down', { pct: Math.abs(revenueDelta) })}
            >
              {data.buckets.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-ink-muted">{t('trend.empty')}</p>
              ) : (
                <div role="img" aria-label={t('trend.aria')} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.buckets} margin={{ left: 4, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={palette.lineSoft} />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: palette.inkMuted }} />
                      <YAxis tick={{ fontSize: 11, fill: palette.inkMuted }} tickFormatter={compact} width={48} />
                      <Tooltip formatter={tooltipMoney} />
                      <Legend />
                      <Area type="monotone" name={t('trend.gross')} dataKey="grossRevenue" stroke={palette.accent} fill={palette.accent} fillOpacity={0.15} />
                      <Area type="monotone" name={t('trend.refunds')} dataKey="refunds" stroke={palette.danger} fill={palette.danger} fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              question={t('splitChart.q')}
              insight={
                s.grossRevenue > 0
                  ? t('splitChart.insight', { platform: Math.round((s.platformFee / s.grossRevenue) * 100), refunds: Math.round((s.refunds / s.grossRevenue) * 100) })
                  : undefined
              }
            >
              {split.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-ink-muted">{t('noData')}</p>
              ) : (
                <div role="img" aria-label={t('splitChart.aria')} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={split} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={2}>
                        {split.map((e, i) => (
                          <Cell key={e.name} fill={[palette.accent, palette.success, palette.danger][i % 3]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={tooltipMoney} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard
              question={t('topCourses.q')}
              insight={topCourses[0] ? t('leader', { name: topCourses[0].full, amount: money(topCourses[0].value), orders: topCourses[0].orders }) : undefined}
            >
              {topCourses.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-ink-muted">{t('noData')}</p>
              ) : (
                <div role="img" aria-label={t('topCourses.aria')} className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCourses} layout="vertical" margin={{ left: 4, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={palette.lineSoft} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: palette.inkMuted }} tickFormatter={compact} />
                      <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: palette.inkMuted }} />
                      <Tooltip formatter={tooltipMoney} labelFormatter={(_, p) => String(p?.[0]?.payload?.full ?? '')} />
                      <Bar dataKey="value" name={t('trend.gross')} fill={palette.accent} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              question={t('topInstructors.q')}
              insight={topInstructors[0] ? t('leader', { name: topInstructors[0].full, amount: money(topInstructors[0].value), orders: topInstructors[0].orders }) : undefined}
            >
              {topInstructors.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-ink-muted">{t('noData')}</p>
              ) : (
                <div role="img" aria-label={t('topInstructors.aria')} className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topInstructors} layout="vertical" margin={{ left: 4, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={palette.lineSoft} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: palette.inkMuted }} tickFormatter={compact} />
                      <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: palette.inkMuted }} />
                      <Tooltip formatter={tooltipMoney} labelFormatter={(_, p) => String(p?.[0]?.payload?.full ?? '')} />
                      <Bar dataKey="value" name={t('trend.gross')} fill={palette.success} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartCard
              question={t('refundRate.q')}
              insight={
                refundRates.length === 0
                  ? t('refundRate.none', { min: MIN_ORDERS_FOR_RATE })
                  : refundRates[0]!.pct >= HIGH_REFUND_PCT
                    ? t('refundRate.review', { name: refundRates[0]!.full, refunded: refundRates[0]!.refunded, orders: refundRates[0]!.orders, pct: refundRates[0]!.pct })
                    : t('refundRate.ok')
              }
            >
              {refundRates.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm font-semibold text-success-ink">{t('refundRate.empty')}</p>
              ) : (
                <div role="img" aria-label={t('refundRate.aria')} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={refundRates} layout="vertical" margin={{ left: 4, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={palette.lineSoft} horizontal={false} />
                      <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: palette.inkMuted }} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: palette.inkMuted }} />
                      <Tooltip formatter={(v) => `${v}%`} labelFormatter={(_, p) => String(p?.[0]?.payload?.full ?? '')} />
                      <Bar dataKey="pct" name={t('refundRate.series')} radius={[0, 4, 4, 0]}>
                        {refundRates.map((r) => (
                          <Cell key={r.full} fill={r.pct >= HIGH_REFUND_PCT ? palette.danger : palette.warning} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              question={t('reasons.q')}
              insight={reasons[0] ? t('reasons.insight', { name: reasons[0].name, count: reasons[0].count, amount: money(reasons[0].value) }) : undefined}
            >
              {reasons.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-ink-muted">{t('reasons.empty')}</p>
              ) : (
                <div role="img" aria-label={t('reasons.aria')} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={reasons} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
                        {reasons.map((r, i) => (
                          <Cell key={r.name} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={tooltipMoney} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              question={t('sources.q')}
              insight={
                sources.length > 1 && s.grossRevenue > 0
                  ? t('sources.insight', { pct: Math.round(((sources.find((x) => x.referral)?.value ?? 0) / s.grossRevenue) * 100) })
                  : undefined
              }
            >
              {sources.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-ink-muted">{t('noData')}</p>
              ) : (
                <div role="img" aria-label={t('sources.aria')} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sources} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
                        {sources.map((x, i) => (
                          <Cell key={x.name} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={tooltipMoney} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard
              question={t('pipeline.q')}
              insight={`${t('pipeline.insight', { obligations: money(s.obligations) })}${s.receivables > 0 ? t('pipeline.receivables', { amount: money(s.receivables) }) : ''}${t('pipeline.paid', { amount: money(s.payoutsPaid), count: s.payoutsPaidCount })}`}
            >
              {data.payoutPipeline.length === 0 ? (
                <p className="m-0 py-6 text-center text-sm font-semibold text-success-ink">{t('pipeline.empty')}</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {data.payoutPipeline.map((p) => {
                    const late = p.oldestDays >= 3;
                    return (
                      <li key={p.status} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 ${late ? 'border-danger/40 bg-danger/5' : 'border-line'}`}>
                        <span className="font-semibold text-ink">{t('pipeline.row', { stage: label('stage', p.status), count: p.count, amount: money(p.amount) })}</span>
                        <span className={`text-xs font-semibold ${late ? 'text-danger' : 'text-ink-muted'}`}>
                          {t('pipeline.oldest', { days: p.oldestDays })}
                          {late ? t('pipeline.late') : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="m-0 mt-3 text-xs text-ink-muted">{t('pipeline.payosFee', { amount: money(s.payosFee), orders: s.payosOrders })}</p>
            </ChartCard>

            <ChartCard
              question={t('recon.q')}
              insight={
                rec.difference === 0
                  ? t('recon.match')
                  : t('recon.diff', { amount: money(Math.abs(rec.difference)), direction: rec.difference > 0 ? t('recon.payosMore') : t('recon.bookMore') })
              }
            >
              <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 ${rec.difference === 0 ? 'border-success/30 bg-success-tint' : 'border-danger/40 bg-danger/5'}`}>
                <span className={`font-semibold ${rec.difference === 0 ? 'text-success-ink' : 'text-danger'}`}>{rec.difference === 0 ? t('recon.ok') : t('recon.mismatch')}</span>
                <span className="text-sm text-ink">
                  {t('recon.summary', {
                    payos: money(rec.payosOutflow),
                    orders: rec.payosOrders,
                    recorded: money(rec.recordedRefunds + rec.recordedPayouts),
                    count: rec.recordedCount,
                  })}
                </span>
              </div>
              {data.mismatches.length > 0 && (
                <ul className="m-0 mt-3 flex list-none flex-col divide-y divide-line-soft p-0">
                  {data.mismatches.map((m) => (
                    <li key={`${m.kind}-${m.reference}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <span className="text-ink">
                        <span className="font-mono text-xs">{m.reference}</span> · {m.kind === 'DISPUTE_REFUND' ? t('recon.refund') : t('recon.payout')} · {money(m.amount)}
                        <span className="block text-xs text-danger">{m.detail}</span>
                      </span>
                      <span className="text-xs text-ink-muted">{dateTime(m.at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </ChartCard>
          </div>
        </>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
        <h2 className="m-0 font-display text-base font-bold text-ink">{t('history.title')}</h2>
        {!snapshots || snapshots.length === 0 ? (
          <p className="m-0 text-sm text-ink-muted">{t('history.empty')}</p>
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
            {snapshots.slice(0, 8).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="text-ink">
                  {label('reportType', r.reportType)} · {r.periodFrom === r.periodTo ? r.periodFrom : t('history.range', { from: r.periodFrom, to: r.periodTo })}
                </span>
                <span className="text-xs text-ink-muted">
                  {dateTime(r.createdAt)} · {r.emailedTo ? t('history.sent', { email: r.emailedTo }) : t('history.notSent')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
