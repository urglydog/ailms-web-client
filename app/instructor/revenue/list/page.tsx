'use client';

import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DateRangeSelector } from '@/components/instructor/DateRangeSelector';
import { InsightCallout } from '@/components/instructor/InsightCallout';
import { DownloadIcon } from '@/components/instructor/SidebarIcons';
import { useRevenueList, useRevenueSummary } from '@/hooks/useDashboard';
import { exportToCsv } from '@/lib/exportCsv';
import { fillMissingDays, formatShortDate } from '@/lib/instructorInsights';
import { formatMoney } from '@/lib/format';
import type { PerformanceRange } from '@/lib/api/dashboard';

type Mode = 'preset' | 'custom';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/** "Hiệu suất" > Doanh thu (29/09/2026, viết lại — gộp trang "Tổng quan"/"Báo cáo doanh thu" cũ
 * vào đây, xem plan redesign). 2 chế độ:
 * - Preset (7d/30d/12m/all): đầy đủ biểu đồ xu hướng + bảng giao dịch (dữ liệu từ `getRevenueList`).
 * - Tự chọn ngày: chỉ có thẻ tổng hợp gộp/phí/thực nhận (`getRevenueSummary` hỗ trợ khoảng ngày
 *   tự do, nhưng BE chưa có endpoint trả DANH SÁCH giao dịch theo khoảng tự do — chấp nhận giới
 *   hạn này thay vì thêm endpoint mới ngoài phạm vi lần sửa này).
 */
export default function RevenuePage() {
  const [mode, setMode] = useState<Mode>('preset');
  const [range, setRange] = useState<PerformanceRange>('30d');
  const [from, setFrom] = useState(daysAgoIso(30));
  const [to, setTo] = useState(todayIso());

  const { data: rows, isLoading: loadingList } = useRevenueList(range);
  const { data: summary, isLoading: loadingSummary } = useRevenueSummary(mode === 'custom' ? from : '', mode === 'custom' ? to : '');

  const total = (rows ?? []).reduce((sum, r) => sum + r.instructorEarning, 0);

  // Gộp theo NGÀY (paidAt là LocalDateTime giờ Việt Nam, không phải UTC — cắt chuỗi trực tiếp an
  // toàn múi giờ, không qua `new Date()`) rồi điền 0 cho ngày trống để biểu đồ không bị nối chéo
  // sai giữa 2 ngày có giao dịch cách xa nhau.
  const chartData = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    const byDay = new Map<string, number>();
    for (const r of rows) {
      const day = r.paidAt.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + r.instructorEarning);
    }
    const days = [...byDay.keys()].sort();
    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    if (!firstDay || !lastDay) return [];
    return fillMissingDays(byDay, firstDay, lastDay);
  }, [rows]);

  // Insight: khóa học đóng góp doanh thu nhiều nhất trong kỳ đang xem.
  const topCourse = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    const byCourse = new Map<string, number>();
    for (const r of rows) {
      byCourse.set(r.courseTitle, (byCourse.get(r.courseTitle) ?? 0) + r.instructorEarning);
    }
    let best: { title: string; amount: number } | null = null;
    for (const [title, amount] of byCourse) {
      if (!best || amount > best.amount) best = { title, amount };
    }
    return best;
  }, [rows]);

  const handleExport = () => {
    if (!rows || rows.length === 0) return;
    exportToCsv(
      `doanh-thu-${range}.csv`,
      rows.map((r) => ({
        'Khóa học': r.courseTitle,
        'Số tiền': r.amount,
        'Thực nhận': r.instructorEarning,
        'Mã giảm giá': r.couponCode ?? '',
        'Ngày thanh toán': new Date(r.paidAt).toLocaleString('vi-VN'),
      })),
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[20px] font-bold text-gray-900">Doanh thu</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-[12.5px] font-semibold">
            <button
              type="button"
              onClick={() => setMode('preset')}
              className={`rounded-md px-3 py-1.5 ${mode === 'preset' ? 'bg-cyan-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Khoảng nhanh
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`rounded-md px-3 py-1.5 ${mode === 'custom' ? 'bg-cyan-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Tự chọn ngày
            </button>
          </div>
          {mode === 'preset' ? (
            <DateRangeSelector value={range} onChange={setRange} />
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12.5px] text-gray-800"
              />
              <span className="text-gray-400">–</span>
              <input
                type="date"
                value={to}
                min={from}
                max={todayIso()}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12.5px] text-gray-800"
              />
            </div>
          )}
          {mode === 'preset' && (
            <button
              type="button"
              onClick={handleExport}
              disabled={!rows || rows.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <DownloadIcon /> Xuất CSV
            </button>
          )}
        </div>
      </div>

      {mode === 'custom' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard label="Số giao dịch" value={loadingSummary ? '...' : String(summary?.transactionCount ?? 0)} />
          <StatCard label="Doanh thu gộp" value={loadingSummary ? '...' : formatMoney(summary?.grossRevenue ?? 0)} />
          <StatCard label="Phí nền tảng" value={loadingSummary ? '...' : formatMoney(summary?.platformFee ?? 0)} tone="text-gray-500" />
          <StatCard label="Thực nhận" value={loadingSummary ? '...' : formatMoney(summary?.netRevenue ?? 0)} tone="text-green-600" />
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-[12.5px] font-semibold text-gray-500">Tổng thực nhận trong khoảng thời gian này</span>
            <div className="mt-1 font-display text-[22px] font-extrabold text-green-600">{formatMoney(total)}</div>
          </div>

          {topCourse && (
            <InsightCallout tone="info">
              Khóa <strong>{topCourse.title}</strong> đóng góp doanh thu nhiều nhất kỳ này: {formatMoney(topCourse.amount)}.
            </InsightCallout>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-display text-[15px] font-bold text-gray-900">Xu hướng doanh thu theo ngày</h2>
            {chartData.length > 0 ? (
              <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={formatShortDate} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                    <Tooltip
                      formatter={(value) => [formatMoney(Number(value ?? 0)), 'Thực nhận']}
                      labelFormatter={(label) => `Ngày ${formatShortDate(String(label ?? ''))}`}
                    />
                    <Area type="monotone" dataKey="value" stroke="#0891b2" fill="#0891b2" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">Chưa có dữ liệu để vẽ biểu đồ.</div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <div className="grid min-w-[720px] grid-cols-[1.4fr_110px_110px_130px_100px_130px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-[11.5px] font-bold text-gray-500">
                <span>Khóa học</span>
                <span>Số tiền</span>
                <span>Thực nhận</span>
                <span>Nguồn</span>
                <span>Mã giảm giá</span>
                <span>Ngày thanh toán</span>
              </div>

              {loadingList && <div className="p-10 text-center text-sm text-gray-500">Đang tải...</div>}
              {!loadingList && (!rows || rows.length === 0) && (
                <div className="p-10 text-center text-sm text-gray-500">Không có giao dịch nào trong khoảng thời gian này.</div>
              )}

              {rows?.map((row, idx) => (
                <div
                  key={idx}
                  className={`grid min-w-[720px] grid-cols-[1.4fr_110px_110px_130px_100px_130px] items-center gap-3 px-4 py-2.5 text-[13px] ${
                    idx < rows.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <span className="truncate font-semibold text-gray-900">{row.courseTitle}</span>
                  <span className="text-gray-600">{formatMoney(row.amount)}</span>
                  <span className="font-semibold text-green-600">{formatMoney(row.instructorEarning)}</span>
                  <span>
                    {row.revenueSource === 'INSTRUCTOR_REFERRAL' ? (
                      <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-bold text-cyan-700">Giới thiệu (97%)</span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">Tự tìm thấy (37%)</span>
                    )}
                  </span>
                  <span className="font-mono text-[12px] text-gray-500">{row.couponCode ?? '—'}</span>
                  <span className="text-gray-500">{new Date(row.paidAt).toLocaleDateString('vi-VN')}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function StatCard({ label, value, tone = 'text-gray-900' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className="text-[11.5px] font-semibold text-gray-500">{label}</span>
      <div className={`mt-1 font-display text-[22px] font-extrabold ${tone}`}>{value}</div>
    </div>
  );
}
