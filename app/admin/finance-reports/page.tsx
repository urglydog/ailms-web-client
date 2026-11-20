'use client';

import Link from 'next/link';
import { useState } from 'react';
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

const GRAN_LABEL: Record<Granularity, string> = { DAY: 'Theo ngày', WEEK: 'Theo tuần', MONTH: 'Theo tháng' };
const REPORT_TYPE_LABEL: Record<string, string> = { DAILY: 'Hằng ngày', WEEKLY: 'Hằng tuần', MONTHLY: 'Hằng tháng', MANUAL: 'Theo yêu cầu' };
const REASON_LABEL: Record<string, string> = {
  BUYER_REMORSE: 'Đổi ý', OTHER: 'Lý do khác', TECHNICAL_ISSUE: 'Lỗi kỹ thuật', DOUBLE_CHARGE: 'Trừ tiền hai lần', NOT_ENROLLED: 'Trừ tiền nhưng chưa ghi danh',
  PLATFORM_FAULT: 'Lỗi từ nền tảng', COPYRIGHT_VIOLATION: 'Vi phạm bản quyền', CONTENT_MISMATCH: 'Nội dung khác mô tả', PROHIBITED_CONTENT: 'Nội dung cấm',
};
const PAYOUT_STAGE_LABEL: Record<string, string> = { REQUESTED: 'Chờ duyệt', APPROVED: 'Đã duyệt, chờ chi' };
const compact = (v: number) => (Math.abs(v) >= 1_000_000 ? `${Math.round(v / 100_000) / 10}tr` : `${Math.round(v / 1000)}k`);
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
      if (res.emailsSent > 0) toast.success('Đã tạo báo cáo và gửi đến email của bạn.');
      else toast.error('Đã lưu báo cáo nhưng chưa gửi được email vì tài khoản của bạn chưa có địa chỉ email nhận thư được. Bạn vẫn có thể tải file bằng nút Chia sẻ.');
      qc.invalidateQueries({ queryKey: ['admin', 'finance-report-snapshots'] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không tạo được báo cáo. Vui lòng thử lại.'),
  });

  const download = async (format: ExportFormat) => {
    saveBlob(await financeReportsApi.export(from, to, gran, format), `bao-cao-tai-chinh-${from}_${to}.${format}`);
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
        { name: 'Phần nền tảng', value: s.platformFee },
        { name: 'Phần giảng viên', value: s.instructorEarning },
        { name: 'Đã hoàn lại học viên', value: s.refunds },
      ].filter((x) => x.value > 0)
    : [];
  const sources = (data?.sources ?? []).map((x) => ({ name: x.source === 'INSTRUCTOR_REFERRAL' ? 'Qua liên kết giới thiệu' : 'Học viên tự tìm thấy', value: x.grossRevenue, orders: x.orders }));
  const reasons = (data?.refundReasons ?? []).map((x) => ({ name: REASON_LABEL[x.reason] ?? x.reason, value: x.amount, count: x.count }));
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
        title="Thống kê tài chính"
        subtitle="Doanh thu, hoàn tiền, chi trả giảng viên và đối soát PayOS của toàn nền tảng."
        action={
          <ExportMenu
            items={[
              { id: 'pdf', label: 'Tải PDF', hint: 'Bản tóm tắt để in hoặc gửi', icon: <FileText size={15} aria-hidden />, onSelect: () => download('pdf') },
              { id: 'xlsx', label: 'Tải Excel (XLSX)', hint: 'Bảng tính nhiều trang, đầy đủ dữ liệu', icon: <FileSpreadsheet size={15} aria-hidden />, onSelect: () => download('xlsx') },
              { id: 'csv', label: 'Tải CSV', hint: 'Dữ liệu thô, mở được bằng mọi phần mềm', icon: <FileDown size={15} aria-hidden />, onSelect: () => download('csv') },
              {
                id: 'mail',
                label: 'Gửi cho tôi qua email',
                hint: 'Tạo báo cáo, lưu vào lịch sử và gửi kèm file',
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
          <span className="text-xs font-semibold text-ink-muted">Từ ngày</span>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">Đến ngày</span>
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">Gom nhóm</span>
          <select value={gran} onChange={(e) => setGran(e.target.value as Granularity)} className={inputCls}>
            {(Object.keys(GRAN_LABEL) as Granularity[]).map((g) => (
              <option key={g} value={g}>{GRAN_LABEL[g]}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => preset(daysAgo(6), iso(new Date()))} className={btnCls}>7 ngày</button>
          <button type="button" onClick={() => preset(daysAgo(29), iso(new Date()))} className={btnCls}>30 ngày</button>
          <button type="button" onClick={() => preset(monthStart(0), iso(new Date()))} className={btnCls}>Tháng này</button>
          <button type="button" onClick={() => preset(monthStart(-1), monthEnd(-1))} className={btnCls}>Tháng trước</button>
        </div>
        <Link href="/admin/settings" className="ml-auto text-sm font-semibold text-accent-dark hover:underline">Cấu hình báo cáo tự động</Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : isError || !s || !prev || !rec || !data ? (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-6 text-center text-danger">
          {error instanceof ApiError ? error.message : 'Không tải được số liệu. Vui lòng kiểm tra khoảng ngày và thử lại.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Doanh thu gộp" value={money(s.grossRevenue)} delta={<Delta current={s.grossRevenue} previous={prev.grossRevenue} />} />
            <Stat label="Doanh thu ròng (sau hoàn tiền)" value={money(s.netRevenue)} delta={<Delta current={s.netRevenue} previous={prev.netRevenue} />} />
            <Stat
              label="Tiền hoàn lại học viên"
              value={money(s.refunds)}
              tone={s.refundRatePct > prev.refundRatePct && s.refundCount > 0 ? 'danger' : undefined}
              delta={<span className="text-xs text-ink-muted">{s.refundCount} khoản · {s.refundRatePct}% số đơn <Delta current={s.refunds} previous={prev.refunds} upIsGood={false} /></span>}
            />
            <Stat label="Phần nền tảng giữ lại" value={money(s.platformFee)} delta={<Delta current={s.platformFee} previous={prev.platformFee} />} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartCard
              className="xl:col-span-2"
              question="Doanh thu đang tăng hay giảm?"
              insight={revenueDelta === null ? undefined : revenueDelta >= 0 ? `Doanh thu gộp tăng ${revenueDelta}% so với kỳ liền trước.` : `Doanh thu gộp giảm ${Math.abs(revenueDelta)}% so với kỳ liền trước.`}
            >
              {data.buckets.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-ink-muted">Không có giao dịch trong kỳ này.</p>
              ) : (
                <div role="img" aria-label="Biểu đồ vùng doanh thu gộp và tiền hoàn theo kỳ" className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.buckets} margin={{ left: 4, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={palette.lineSoft} />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: palette.inkMuted }} />
                      <YAxis tick={{ fontSize: 11, fill: palette.inkMuted }} tickFormatter={compact} width={48} />
                      <Tooltip formatter={tooltipMoney} />
                      <Legend />
                      <Area type="monotone" name="Doanh thu gộp" dataKey="grossRevenue" stroke={palette.accent} fill={palette.accent} fillOpacity={0.15} />
                      <Area type="monotone" name="Tiền hoàn" dataKey="refunds" stroke={palette.danger} fill={palette.danger} fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              question="Tiền thực sự về ai?"
              insight={s.grossRevenue > 0 ? `Nền tảng giữ lại ${Math.round((s.platformFee / s.grossRevenue) * 100)}% doanh thu gộp, hoàn lại học viên ${Math.round((s.refunds / s.grossRevenue) * 100)}%.` : undefined}
            >
              {split.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-ink-muted">Chưa có dữ liệu.</p>
              ) : (
                <div role="img" aria-label="Biểu đồ tròn phân bổ doanh thu giữa nền tảng, giảng viên và tiền hoàn" className="h-64 w-full">
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
            <ChartCard question="Khóa học nào mang lại nhiều doanh thu nhất?" insight={topCourses[0] ? `Dẫn đầu: ${topCourses[0].full} (${money(topCourses[0].value)}, ${topCourses[0].orders} đơn).` : undefined}>
              {topCourses.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-ink-muted">Chưa có dữ liệu.</p>
              ) : (
                <div role="img" aria-label="Biểu đồ cột doanh thu theo khóa học" className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCourses} layout="vertical" margin={{ left: 4, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={palette.lineSoft} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: palette.inkMuted }} tickFormatter={compact} />
                      <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: palette.inkMuted }} />
                      <Tooltip formatter={tooltipMoney} labelFormatter={(_, p) => String(p?.[0]?.payload?.full ?? '')} />
                      <Bar dataKey="value" name="Doanh thu gộp" fill={palette.accent} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard question="Giảng viên nào đóng góp nhiều doanh thu nhất?" insight={topInstructors[0] ? `Dẫn đầu: ${topInstructors[0].full} (${money(topInstructors[0].value)}, ${topInstructors[0].orders} đơn).` : undefined}>
              {topInstructors.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-ink-muted">Chưa có dữ liệu.</p>
              ) : (
                <div role="img" aria-label="Biểu đồ cột doanh thu theo giảng viên" className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topInstructors} layout="vertical" margin={{ left: 4, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={palette.lineSoft} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: palette.inkMuted }} tickFormatter={compact} />
                      <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: palette.inkMuted }} />
                      <Tooltip formatter={tooltipMoney} labelFormatter={(_, p) => String(p?.[0]?.payload?.full ?? '')} />
                      <Bar dataKey="value" name="Doanh thu gộp" fill={palette.success} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartCard
              question="Khóa học nào đang bị hoàn tiền nhiều bất thường?"
              insight={
                refundRates.length === 0
                  ? `Không có khóa nào có từ ${MIN_ORDERS_FOR_RATE} đơn trở lên bị hoàn tiền trong kỳ này.`
                  : refundRates[0]!.pct >= HIGH_REFUND_PCT
                    ? `Cần xem lại chất lượng "${refundRates[0]!.full}": ${refundRates[0]!.refunded}/${refundRates[0]!.orders} đơn bị hoàn (${refundRates[0]!.pct}%).`
                    : 'Không khóa nào vượt ngưỡng cảnh báo.'
              }
            >
              {refundRates.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm font-semibold text-success-ink">Không có khóa học nào đáng lo ngại.</p>
              ) : (
                <div role="img" aria-label="Biểu đồ cột tỷ lệ hoàn tiền theo khóa học" className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={refundRates} layout="vertical" margin={{ left: 4, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={palette.lineSoft} horizontal={false} />
                      <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: palette.inkMuted }} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: palette.inkMuted }} />
                      <Tooltip formatter={(v) => `${v}%`} labelFormatter={(_, p) => String(p?.[0]?.payload?.full ?? '')} />
                      <Bar dataKey="pct" name="Tỷ lệ hoàn" radius={[0, 4, 4, 0]}>
                        {refundRates.map((r) => (
                          <Cell key={r.full} fill={r.pct >= HIGH_REFUND_PCT ? palette.danger : palette.warning} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard question="Học viên xin hoàn tiền vì lý do gì?" insight={reasons[0] ? `Nhiều nhất: ${reasons[0].name} (${reasons[0].count} khoản, ${money(reasons[0].value)}).` : undefined}>
              {reasons.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-ink-muted">Không có khoản hoàn nào trong kỳ.</p>
              ) : (
                <div role="img" aria-label="Biểu đồ tròn hoàn tiền theo lý do" className="h-64 w-full">
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
              question="Doanh thu đến từ đâu?"
              insight={sources.length > 1 && s.grossRevenue > 0 ? `${Math.round((sources.find((x) => x.name.startsWith('Qua'))?.value ?? 0) / s.grossRevenue * 100)}% doanh thu đến từ liên kết giới thiệu của giảng viên.` : undefined}
            >
              {sources.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-ink-muted">Chưa có dữ liệu.</p>
              ) : (
                <div role="img" aria-label="Biểu đồ tròn doanh thu theo nguồn" className="h-64 w-full">
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
              question="Nền tảng còn nợ giảng viên bao nhiêu, yêu cầu nào đang chờ lâu?"
              insight={`Nghĩa vụ chưa trả giảng viên: ${money(s.obligations)}${s.receivables > 0 ? ` · giảng viên đang nợ nền tảng: ${money(s.receivables)}` : ''}. Đã chi trả trong kỳ: ${money(s.payoutsPaid)} (${s.payoutsPaidCount} lần).`}
            >
              {data.payoutPipeline.length === 0 ? (
                <p className="m-0 py-6 text-center text-sm font-semibold text-success-ink">Không có yêu cầu rút tiền nào đang chờ xử lý.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {data.payoutPipeline.map((p) => {
                    const late = p.oldestDays >= 3;
                    return (
                      <li key={p.status} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 ${late ? 'border-danger/40 bg-danger/5' : 'border-line'}`}>
                        <span className="font-semibold text-ink">{PAYOUT_STAGE_LABEL[p.status] ?? p.status}: {p.count} yêu cầu · {money(p.amount)}</span>
                        <span className={`text-xs font-semibold ${late ? 'text-danger' : 'text-ink-muted'}`}>
                          Cũ nhất {p.oldestDays} ngày{late ? ' — cần xử lý' : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="m-0 mt-3 text-xs text-ink-muted">
                Chi phí chuyển tiền PayOS trong kỳ: {money(s.payosFee)} ({s.payosOrders} lệnh chi thành công), do nền tảng chịu.
              </p>
            </ChartCard>

            <ChartCard
              question="Tiền chi qua PayOS có khớp với sổ sách không?"
              insight={
                rec.difference === 0
                  ? 'Mọi lệnh chi PayOS thành công trong kỳ đều khớp với khoản hoàn tiền và chi trả đã ghi nhận.'
                  : `Lệch ${money(Math.abs(rec.difference))}: ${rec.difference > 0 ? 'PayOS đã chi nhiều hơn số đã ghi nhận' : 'sổ sách ghi nhiều hơn số PayOS đã chi'}. Xem danh sách khoản lệch bên dưới.`
              }
            >
              <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 ${rec.difference === 0 ? 'border-success/30 bg-success-tint' : 'border-danger/40 bg-danger/5'}`}>
                <span className={`font-semibold ${rec.difference === 0 ? 'text-success-ink' : 'text-danger'}`}>{rec.difference === 0 ? 'Khớp' : 'Có chênh lệch'}</span>
                <span className="text-sm text-ink">
                  PayOS đã chi {money(rec.payosOutflow)} ({rec.payosOrders} lệnh) · sổ sách ghi nhận {money(rec.recordedRefunds + rec.recordedPayouts)} ({rec.recordedCount} khoản)
                </span>
              </div>
              {data.mismatches.length > 0 && (
                <ul className="m-0 mt-3 flex list-none flex-col divide-y divide-line-soft p-0">
                  {data.mismatches.map((m) => (
                    <li key={`${m.kind}-${m.reference}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <span className="text-ink">
                        <span className="font-mono text-xs">{m.reference}</span> · {m.kind === 'DISPUTE_REFUND' ? 'Hoàn tiền' : 'Chi trả giảng viên'} · {money(m.amount)}
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
        <h2 className="m-0 font-display text-base font-bold text-ink">Lịch sử báo cáo đã gửi</h2>
        {!snapshots || snapshots.length === 0 ? (
          <p className="m-0 text-sm text-ink-muted">Chưa có báo cáo nào. Báo cáo định kỳ được tạo tự động theo cấu hình; bạn cũng có thể chọn &quot;Gửi cho tôi qua email&quot; trong nút Chia sẻ.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
            {snapshots.slice(0, 8).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="text-ink">
                  {REPORT_TYPE_LABEL[r.reportType] ?? r.reportType} · {r.periodFrom === r.periodTo ? r.periodFrom : `${r.periodFrom} đến ${r.periodTo}`}
                </span>
                <span className="text-xs text-ink-muted">
                  {dateTime(r.createdAt)} · {r.emailedTo ? `đã gửi ${r.emailedTo}` : 'chưa gửi email'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
