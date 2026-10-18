'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { activeFilterChips, type FilterChip, type FilterKey } from '@/lib/courses/filterChips';
import type { Category, CourseFilterState } from '@/types/domain';

interface ActiveFiltersProps {
  filters: CourseFilterState;
  categories: Category[];
  onClear: (key: FilterKey) => void;
  onClearAll: () => void;
}

/** Dải chip các bộ lọc đang bật, mỗi chip bỏ được riêng, kèm "Xóa tất cả". Không bật gì thì không vẽ. */
export function ActiveFilters({ filters, categories, onClear, onClearAll }: ActiveFiltersProps) {
  const t = useTranslations('courseList');
  const chips = activeFilterChips(filters, categories);
  if (chips.length === 0) return null;

  const labelOf = (chip: FilterChip): string => {
    switch (chip.kind) {
      case 'keyword':
        return `“${chip.value}”`;
      case 'level':
        return t(`level.${chip.value}`);
      case 'price':
        return chip.value === 'free' ? t('filters.free') : t('filters.paid');
      case 'rating':
        return t('ratingTier', { tier: Number(chip.value).toFixed(1) });
      case 'duration':
        return t(`duration.${chip.value}`);
      default:
        return chip.value;
    }
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm text-ink-muted">{t('activeLabel')}</span>
      {chips.map((chip) => {
        const label = labelOf(chip);
        return (
          <span
            key={chip.key}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-tint py-1 pl-3 pr-1.5 text-[13px] font-semibold text-accent-dark"
          >
            {label}
            <button
              type="button"
              onClick={() => onClear(chip.key)}
              aria-label={t('remove', { name: label })}
              className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white"
            >
              <X size={12} aria-hidden />
            </button>
          </span>
        );
      })}
      <button
        type="button"
        onClick={onClearAll}
        className="text-[13px] font-semibold text-accent-dark underline-offset-4 hover:underline"
      >
        {t('clearAll')}
      </button>
    </div>
  );
}
