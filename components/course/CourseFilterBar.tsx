'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { PopoverMotion } from '@/components/ui/PopoverMotion';
import { EMPTY_FILTERS } from '@/lib/api/publicCourses';
import type { Category, CourseFilterState } from '@/types/domain';

/**
 * Thanh lọc NGANG của Kho khóa học (08/11/2026) — thay cột lọc dọc bên trái để lưới khóa học dùng
 * hết chiều ngang. Mỗi nhóm (Danh mục, Đánh giá, Thời lượng, Học phí, Trình độ) là một nút; bấm
 * mở popover liệt kê lựa chọn. Nhóm đang có giá trị thì nút tô màu và ghi giá trị đã chọn.
 *
 * Bỏ số đếm cạnh từng lựa chọn: trước đây phải tải TOÀN BỘ khóa học chỉ để đếm, đi ngược mục tiêu
 * phân trang (khi dữ liệu lớn sẽ rất nặng).
 */
const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
const RATING_TIERS = [4.5, 4.0, 3.5, 3.0] as const;
const DURATION_BUCKETS = ['0-1', '1-3', '3-6', '6-17', '17+'] as const;

type GroupKey = 'category' | 'rating' | 'duration' | 'price' | 'level';

interface CourseFilterBarProps {
  filters: CourseFilterState;
  onChange: (next: CourseFilterState) => void;
  categories: Category[];
}

export function CourseFilterBar({ filters, onChange, categories }: CourseFilterBarProps) {
  const t = useTranslations('courseList');
  const [open, setOpen] = useState<GroupKey | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  /** Chọn lại giá trị đang chọn thì bỏ chọn; chọn xong đóng popover. */
  const pick = <K extends keyof CourseFilterState>(key: K, value: CourseFilterState[K], empty: CourseFilterState[K]) => {
    onChange({ ...filters, [key]: filters[key] === value ? empty : value });
    setOpen(null);
  };

  const categoryName = categories.find((c) => c.slug === filters.category)?.name;
  const groups: { key: GroupKey; label: string; value: string | null; options: ReactNode }[] = [
    {
      key: 'category',
      label: t('filters.category'),
      value: categoryName ?? null,
      options: categories.map((c) => (
        <Option key={c.slug} checked={filters.category === c.slug} onSelect={() => pick('category', c.slug, null)}>
          {c.name}
        </Option>
      )),
    },
    {
      key: 'rating',
      label: t('filters.rating'),
      value: filters.minRating !== null ? `★ ${t('ratingTier', { tier: filters.minRating.toFixed(1) })}` : null,
      options: RATING_TIERS.map((tier) => (
        <Option key={tier} checked={filters.minRating === tier} onSelect={() => pick('minRating', tier, null)}>
          <span className="text-star" aria-hidden>
            ★
          </span>{' '}
          {t('ratingTier', { tier: tier.toFixed(1) })}
        </Option>
      )),
    },
    {
      key: 'duration',
      label: t('filters.duration'),
      value: filters.durationBucket ? t(`duration.${filters.durationBucket}`) : null,
      options: DURATION_BUCKETS.map((b) => (
        <Option key={b} checked={filters.durationBucket === b} onSelect={() => pick('durationBucket', b, null)}>
          {t(`duration.${b}`)}
        </Option>
      )),
    },
    {
      key: 'price',
      label: t('filters.price'),
      value: filters.priceType === 'all' ? null : t(`filters.${filters.priceType}`),
      options: (['free', 'paid'] as const).map((p) => (
        <Option key={p} checked={filters.priceType === p} onSelect={() => pick('priceType', p, 'all')}>
          {t(`filters.${p}`)}
        </Option>
      )),
    },
    {
      key: 'level',
      label: t('filters.level'),
      value: filters.level ? t(`level.${filters.level}`) : null,
      options: LEVELS.map((lv) => (
        <Option key={lv} checked={filters.level === lv} onSelect={() => pick('level', lv, null)}>
          {t(`level.${lv}`)}
        </Option>
      )),
    },
  ];

  const activeCount = groups.filter((g) => g.value !== null).length;

  return (
    <div ref={rootRef} role="group" aria-label={t('filters.aria')} className="flex flex-wrap items-center gap-2">
      {/* "Tất cả bộ lọc" luôn hiện; trên mobile đây là lối vào duy nhất (chip từng nhóm chỉ hiện từ md). */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-haspopup="dialog"
        className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors duration-150 ${
          activeCount > 0 ? 'border-accent bg-accent/10 text-accent-dark' : 'border-line bg-surface-raised text-ink hover:border-accent'
        }`}
      >
        <SlidersHorizontal size={15} aria-hidden />
        {t('filters.all')}
        {activeCount > 0 && <span className="font-medium">({activeCount})</span>}
      </button>
      <span aria-hidden className="hidden h-6 w-px bg-line md:block" />
      {groups.map((g) => {
        const isOpen = open === g.key;
        const active = g.value !== null;
        return (
          <div key={g.key} className="relative hidden md:block">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              onClick={() => setOpen(isOpen ? null : g.key)}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors duration-150 ${
                active
                  ? 'border-accent bg-accent/10 text-accent-dark'
                  : 'border-line bg-surface-raised text-ink hover:border-accent'
              }`}
            >
              <span>{g.label}</span>
              {active && <span className="max-w-[10rem] truncate font-medium">: {g.value}</span>}
              <ChevronDown
                size={15}
                aria-hidden
                className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <PopoverMotion
              open={isOpen}
              origin="top left"
              className={`absolute left-0 top-full z-[150] mt-2 max-h-80 overflow-y-auto rounded-panel border border-line bg-surface-raised p-1.5 shadow-card-hover ${
                g.key === 'category' ? 'w-[min(34rem,90vw)] columns-1 sm:columns-2' : 'w-56'
              }`}
            >
              <ul role="listbox" aria-label={g.label} className="m-0 list-none p-0">
                {g.options}
              </ul>
            </PopoverMotion>
          </div>
        );
      })}

      <Modal
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t('filters.all')}
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onChange({ ...EMPTY_FILTERS, keyword: filters.keyword })}
              className="min-h-10 text-sm font-semibold text-accent-dark hover:underline"
            >
              {t('filters.clear')}
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="min-h-10 rounded-control bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-dark"
            >
              {t('filters.done')}
            </button>
          </div>
        }
      >
        <div className="flex flex-col divide-y divide-line-soft">
          {groups.map((g) => (
            <section key={g.key} className="py-4 first:pt-0">
              <h3 className="m-0 mb-2 font-display text-[15px] font-semibold text-ink">{g.label}</h3>
              <ul role="listbox" aria-label={g.label} className={`m-0 list-none p-0 ${g.key === 'category' ? 'sm:columns-2' : ''}`}>
                {g.options}
              </ul>
            </section>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function Option({ checked, onSelect, children }: { checked: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <li role="option" aria-selected={checked} className="break-inside-avoid">
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors duration-150 ${
          checked ? 'bg-accent/10 font-semibold text-accent-dark' : 'text-ink hover:bg-tint'
        }`}
      >
        <span
          aria-hidden
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
            checked ? 'border-accent bg-accent text-white' : 'border-line'
          }`}
        >
          {checked && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        <span className="min-w-0">{children}</span>
      </button>
    </li>
  );
}
