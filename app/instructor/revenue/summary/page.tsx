'use client';

import { useState } from 'react';
import { useRevenueSummary } from '@/hooks/useDashboard';

function formatMoney(value: number): string {
  return `${value.toLocaleString('vi-VN')}đ`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

/** "Hiệu suất" > Báo cáo doanh thu (29/09/2026, xây mới — Sprint 3 mục 10) — khác trang "Doanh
 * thu" (chỉ hỗ trợ preset 7d/30d/12m/all): ở đây chọn khoảng NGÀY TỰ DO, xem tách bạch doanh thu
 * gộp / phí nền tảng / thực nhận thay vì chỉ 1 số "thực nhận" gộp chung. */
export default function RevenueSummaryPage() {
  const [from, setFrom] = useState(firstDayOfMonthIso());
  const [to, setTo] = useState(todayIso());
  const { data: summary, isLoading, isError } = useRevenueSummary(from, to);

  return (
    <>
      <div>
        <h1 className="m-0 font-display text-[20px] font-bold text-gray-900">Báo cáo doanh thu</h1>
        <p className="mt-1 text-[12.5px] text-gray-500">Doanh thu gộp, phí nền tảng và thực nhận theo khoảng ngày tự chọn.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-gray-500">Từ ngày</span>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] text-gray-800"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-gray-500">Đến ngày</span>
          <input
            type="date"
            value={to}
            min={from}
            max={todayIso()}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] text-gray-800"
          />
        </label>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-600">
          Không tải được báo cáo, thử lại sau.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Số giao dịch" value={isLoading ? '...' : String(summary?.transactionCount ?? 0)} />
        <StatCard label="Doanh thu gộp" value={isLoading ? '...' : formatMoney(summary?.grossRevenue ?? 0)} />
        <StatCard label="Phí nền tảng" value={isLoading ? '...' : formatMoney(summary?.platformFee ?? 0)} tone="text-gray-500" />
        <StatCard label="Thực nhận" value={isLoading ? '...' : formatMoney(summary?.netRevenue ?? 0)} tone="text-green-600" />
      </div>
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
