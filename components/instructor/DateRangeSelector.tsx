'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PerformanceRange } from '@/lib/api/dashboard';

const RANGES: PerformanceRange[] = ['7d', '30d', '12m', 'all'];

/** Bộ chọn khoảng thời gian dùng chung cho khu "Hiệu suất"; mở bằng nút, chọn bằng chuột hoặc bàn phím, Escape hoặc bấm ra ngoài để đóng. */
export function DateRangeSelector({ value, onChange }: { value: PerformanceRange; onChange: (range: PerformanceRange) => void }) {
  const t = useTranslations('instructor.performance.range');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-ink hover:border-accent"
      >
        <Calendar size={14} aria-hidden className="text-accent" />
        {t(value)}
        <ChevronDown size={14} aria-hidden className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>
      {open && (
        <ul role="listbox" aria-label={t('label')} className="absolute right-0 top-full z-10 m-0 mt-1 w-44 list-none overflow-hidden rounded-lg border border-line bg-white p-0 py-1 shadow-card-hover">
          {RANGES.map((range) => (
            <li
              key={range}
              role="option"
              aria-selected={value === range}
              tabIndex={0}
              onClick={() => {
                onChange(range);
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(range);
                  setOpen(false);
                }
              }}
              className={`cursor-pointer px-3 py-1.5 text-left text-[12.5px] hover:bg-surface ${value === range ? 'font-bold text-accent-dark' : 'text-ink'}`}
            >
              {t(range)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
