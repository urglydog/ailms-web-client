'use client';

import { useState } from 'react';
import type { PerformanceRange } from '@/lib/api/dashboard';

const RANGE_LABEL: Record<PerformanceRange, string> = {
  '7d': '7 ngày qua',
  '30d': '30 ngày qua',
  '12m': '12 tháng qua',
  all: 'Mọi thời điểm',
};

/** Bộ chọn khoảng thời gian dùng chung cho trang "Hiệu suất" (19/09/2026, mở rộng — giao diện
 * tham khảo Udemy "Date range"). */
export function DateRangeSelector({ value, onChange }: { value: PerformanceRange; onChange: (range: PerformanceRange) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-gray-700 hover:border-gray-300"
      >
        {RANGE_LABEL[value]} ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-36 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {(Object.keys(RANGE_LABEL) as PerformanceRange[]).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => {
                onChange(range);
                setOpen(false);
              }}
              className={`block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-gray-50 ${
                value === range ? 'font-bold text-cyan-700' : 'text-gray-700'
              }`}
            >
              {RANGE_LABEL[range]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
