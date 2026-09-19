'use client';

import { useState } from 'react';
import { DateRangeSelector } from '@/components/instructor/DateRangeSelector';
import { DownloadIcon } from '@/components/instructor/SidebarIcons';
import { usePerformanceOverview, useRevenueList } from '@/hooks/useDashboard';
import { exportToCsv } from '@/lib/exportCsv';
import type { PerformanceRange } from '@/lib/api/dashboard';

function formatMoney(value: number): string {
  return `${value.toLocaleString('vi-VN')}đ`;
}

/** "Hiệu suất" > Tổng quan — giao diện tham khảo Udemy (19/09/2026, xây mới). */
export default function PerformanceOverviewPage() {
  const [range, setRange] = useState<PerformanceRange>('30d');
  const { data: overview, isLoading } = usePerformanceOverview(range);
  const { data: revenueRows } = useRevenueList(range);

  const handleExport = () => {
    if (!revenueRows || revenueRows.length === 0) return;
    exportToCsv(
      `doanh-thu-${range}.csv`,
      revenueRows.map((r) => ({
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
        <div>
          <h1 className="m-0 font-display text-[20px] font-bold text-gray-900">Tổng quan</h1>
          <p className="mt-1 text-[12.5px] text-gray-500">Nhận thông tin chi tiết hàng đầu về hiệu suất của bạn.</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeSelector value={range} onChange={setRange} />
          <button
            type="button"
            onClick={handleExport}
            disabled={!revenueRows || revenueRows.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon /> Xuất CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Doanh thu (thực nhận)" value={isLoading ? '...' : formatMoney(overview?.revenue ?? 0)} />
        <StatCard label="Lượt đăng ký mới" value={isLoading ? '...' : String(overview?.enrollments ?? 0)} />
        <StatCard label="Điểm đánh giá trung bình" value={isLoading ? '...' : (overview?.avgRating ?? 0).toFixed(2)} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-display text-[15px] font-bold text-gray-900">Doanh thu gần đây</h2>
        <p className="mb-4 text-[12px] text-gray-400">Xem đầy đủ ở tab &quot;Doanh thu&quot; bên trái.</p>
        {!revenueRows || revenueRows.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-gray-400">Không có dữ liệu trong khoảng thời gian này.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {revenueRows.slice(0, 5).map((row, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 border-b border-gray-50 py-2 text-[13px] last:border-0">
                <span className="min-w-0 flex-1 truncate text-gray-800">{row.courseTitle}</span>
                <span className="shrink-0 text-gray-400">{new Date(row.paidAt).toLocaleDateString('vi-VN')}</span>
                <span className="shrink-0 font-semibold text-green-600">{formatMoney(row.instructorEarning)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className="text-[11.5px] font-semibold text-gray-500">{label}</span>
      <div className="mt-1 font-display text-[24px] font-extrabold text-gray-900">{value}</div>
    </div>
  );
}
