'use client';

import { useMemo, useState } from 'react';
import { AreaChart, Area, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DateRangeSelector } from '@/components/instructor/DateRangeSelector';
import { InsightCallout } from '@/components/instructor/InsightCallout';
import { DownloadIcon } from '@/components/instructor/SidebarIcons';
import { useRevenueList, useRevenueSummary } from '@/hooks/useDashboard';
import { exportToCsv } from '@/lib/exportCsv';
import { fillMissingDaysMulti, formatShortDate } from '@/lib/instructorInsights';
import { formatMoney } from '@/lib/format';
import type { PerformanceRange } from '@/lib/api/dashboard';

const COLOR_ORGANIC = '#059669';
const COLOR_REFERRAL = '#0891b2';

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
  // toàn múi giờ, không qua `new Date()`), TÁCH RIÊNG theo nguồn doanh thu (Tự tìm thấy/Giới
  // thiệu) để vẽ cột xếp chồng — đúng bản chất "có đơn thì cột dựng lên, không có thì rỗng", thay
  // vì đường cong AreaChart cũ làm sai lệch cảm giác về những ngày không bán được gì. Điền 0 cho
  // ngày trống để không bị nối chéo/thiếu cột.
  const chartData = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    const byDay = new Map<string, { organic: number; referral: number }>();
    for (const r of rows) {
      const day = r.paidAt.slice(0, 10);
      const entry = byDay.get(day) ?? { organic: 0, referral: 0 };
      if (r.revenueSource === 'INSTRUCTOR_REFERRAL') entry.referral += r.instructorEarning;
      else entry.organic += r.instructorEarning;
      byDay.set(day, entry);
    }
    const days = [...byDay.keys()].sort();
    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    if (!firstDay || !lastDay) return [];
    return fillMissingDaysMulti(byDay, ['organic', 'referral'], firstDay, lastDay);
  }, [rows]);

  // Đường lũy kế — tách thành biểu đồ RIÊNG (không dùng trục Y thứ 2 trên cùng 1 chart: 2 trục Y
  // trên 1 biểu đồ là kiểu vẽ dễ gây hiểu lầm vì thang đo tùy tiện co giãn để khớp nhau, xem thêm
  // `dataviz` skill — "One axis. Never a dual-axis chart"). Cột theo ngày + đường lũy kế là 2 câu
  // hỏi khác nhau ("hôm nay thế nào" vs "đà tăng trưởng ra sao"), tách 2 panel rõ ràng hơn là gộp
  // cưỡng ép vào 1 chart.
  const cumulativeData = useMemo(() => {
    let running = 0;
    return chartData.map((d) => {
      running += d.organic + d.referral;
      return { day: d.day, total: running };
    });
  }, [chartData]);

  // Mini analytics: Gói combo vs Bán lẻ, và Có mã giảm giá vs Giá gốc — cả 2 tính thẳng từ dữ
  // liệu đã fetch, không cần endpoint mới (bundleId/couponCode đã có sẵn trên mỗi giao dịch).
  const splitStats = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    let bundleAmount = 0;
    let retailAmount = 0;
    let couponAmount = 0;
    for (const r of rows) {
      if (r.bundleId) bundleAmount += r.instructorEarning;
      else retailAmount += r.instructorEarning;
      if (r.couponCode) couponAmount += r.instructorEarning;
    }
    const totalAmount = bundleAmount + retailAmount;
    if (totalAmount === 0) return null;
    return {
      bundlePercent: (bundleAmount / totalAmount) * 100,
      couponPercent: (couponAmount / totalAmount) * 100,
    };
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

          {splitStats && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SplitBar label="Gói combo vs Bán lẻ" percent={splitStats.bundlePercent} leftLabel="Gói combo" rightLabel="Bán lẻ" />
              <SplitBar label="Có mã giảm giá vs Giá gốc" percent={splitStats.couponPercent} leftLabel="Có mã giảm giá" rightLabel="Giá gốc" />
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 font-display text-[15px] font-bold text-gray-900">Doanh thu theo ngày</h2>
            <div className="mb-3 flex items-center gap-4 text-[12px] text-gray-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_ORGANIC }} /> Tự tìm thấy</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_REFERRAL }} /> Giới thiệu</span>
            </div>
            {chartData.length > 0 ? (
              <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={formatShortDate} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                    <Tooltip
                      formatter={(value, name) => [formatMoney(Number(value ?? 0)), name === 'organic' ? 'Tự tìm thấy' : 'Giới thiệu']}
                      labelFormatter={(label) => `Ngày ${formatShortDate(String(label ?? ''))}`}
                    />
                    <Bar dataKey="organic" stackId="revenue" fill={COLOR_ORGANIC} />
                    <Bar dataKey="referral" stackId="revenue" fill={COLOR_REFERRAL} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">Chưa có dữ liệu để vẽ biểu đồ.</div>
            )}
          </div>

          {cumulativeData.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-display text-[15px] font-bold text-gray-900">Doanh thu lũy kế trong kỳ</h2>
              <div className="h-40 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={formatShortDate} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                    <Tooltip
                      formatter={(value) => [formatMoney(Number(value ?? 0)), 'Lũy kế']}
                      labelFormatter={(label) => `Ngày ${formatShortDate(String(label ?? ''))}`}
                    />
                    <Area type="monotone" dataKey="total" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.12} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

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

/** Thẻ tỷ lệ 2 phần (Gói combo/Bán lẻ, Có mã/Giá gốc) — thanh 2 màu xếp ngang thay vì số liệu
 * khô khan, tính từ `instructorEarning` (thực nhận), không cần endpoint mới. */
function SplitBar({ label, percent, leftLabel, rightLabel }: { label: string; percent: number; leftLabel: string; rightLabel: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className="text-[11.5px] font-semibold text-gray-500">{label}</span>
      <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full bg-cyan-500" style={{ width: `${percent}%` }} />
        <div className="h-full bg-gray-300" style={{ width: `${100 - percent}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11.5px] text-gray-500">
        <span>{leftLabel} ({percent.toFixed(0)}%)</span>
        <span>{rightLabel} ({(100 - percent).toFixed(0)}%)</span>
      </div>
    </div>
  );
}
