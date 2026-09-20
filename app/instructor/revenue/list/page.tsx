'use client';

import { useState } from 'react';
import { DateRangeSelector } from '@/components/instructor/DateRangeSelector';
import { DownloadIcon } from '@/components/instructor/SidebarIcons';
import { useRevenueList } from '@/hooks/useDashboard';
import { exportToCsv } from '@/lib/exportCsv';
import type { PerformanceRange } from '@/lib/api/dashboard';

function formatMoney(value: number): string {
  return `${value.toLocaleString('vi-VN')}đ`;
}

/** "Hiệu suất" > Doanh thu — danh sách giao dịch chi tiết (19/09/2026, xây mới). */
export default function RevenueListPage() {
  const [range, setRange] = useState<PerformanceRange>('30d');
  const { data: rows, isLoading } = useRevenueList(range);

  const total = (rows ?? []).reduce((sum, r) => sum + r.instructorEarning, 0);

  const handleExport = () => {
    if (!rows || rows.length === 0) return;
    exportToCsv(
      `doanh-thu-chi-tiet-${range}.csv`,
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
          <DateRangeSelector value={range} onChange={setRange} />
          <button
            type="button"
            onClick={handleExport}
            disabled={!rows || rows.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon /> Xuất CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <span className="text-[12.5px] font-semibold text-gray-500">Tổng thực nhận trong khoảng thời gian này</span>
        <div className="mt-1 font-display text-[22px] font-extrabold text-green-600">{formatMoney(total)}</div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.4fr_110px_110px_130px_100px_130px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-[11.5px] font-bold text-gray-500">
          <span>Khóa học</span>
          <span>Số tiền</span>
          <span>Thực nhận</span>
          <span>Nguồn</span>
          <span>Mã giảm giá</span>
          <span>Ngày thanh toán</span>
        </div>

        {isLoading && <div className="p-10 text-center text-sm text-gray-500">Đang tải...</div>}
        {!isLoading && (!rows || rows.length === 0) && (
          <div className="p-10 text-center text-sm text-gray-500">Không có giao dịch nào trong khoảng thời gian này.</div>
        )}

        {rows?.map((row, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-[1.4fr_110px_110px_130px_100px_130px] items-center gap-3 px-4 py-2.5 text-[13px] ${
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
    </>
  );
}
