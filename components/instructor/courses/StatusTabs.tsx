'use client';

import { useTranslations } from 'next-intl';
import type { StatusCounts, StatusFilter } from '@/lib/instructor/courseList';

const ORDER: StatusFilter[] = ['ALL', 'DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];

interface StatusTabsProps {
  counts: StatusCounts;
  active: StatusFilter;
  onChange: (status: StatusFilter) => void;
}

/** Tab lọc theo trạng thái khóa, kèm số lượng; mũi tên trái/phải chuyển tab. */
export function StatusTabs({ counts, active, onChange }: StatusTabsProps) {
  const t = useTranslations('instructor.courses.status');
  const move = (from: StatusFilter, step: 1 | -1) => {
    const next = ORDER[(ORDER.indexOf(from) + step + ORDER.length) % ORDER.length];
    if (next) onChange(next);
  };

  return (
    <div role="tablist" aria-label={t('ALL')} className="flex flex-wrap gap-2">
      {ORDER.map((status) => {
        const selected = status === active;
        return (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(status)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                move(status, 1);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                move(status, -1);
              }
            }}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
              selected ? 'bg-accent text-white' : 'border border-line bg-white text-ink-muted hover:border-accent hover:text-ink'
            }`}
          >
            {t(status)} <span className={selected ? 'text-white/85' : 'text-ink-muted'}>{counts[status]}</span>
          </button>
        );
      })}
    </div>
  );
}
