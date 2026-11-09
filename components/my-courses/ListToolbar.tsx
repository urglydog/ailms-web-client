'use client';

import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Chip } from '@/components/ui/Chip';
import type { SortOption, StatusFilter, ViewMode } from '@/lib/myCourses/model';

interface ListToolbarProps {
  status: StatusFilter;
  counts: Record<StatusFilter, number>;
  onStatusChange: (status: StatusFilter) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  /** Chỉ gọi khi nhấn Enter hoặc bấm nút tìm, không gọi theo từng phím gõ. */
  onSearch: (query: string) => void;
}

const SORTS: ReadonlyArray<{ value: SortOption; key: string }> = [
  { value: 'recently-accessed', key: 'recentlyAccessed' },
  { value: 'recently-enrolled', key: 'recentlyEnrolled' },
  { value: 'title-asc', key: 'titleAsc' },
  { value: 'title-desc', key: 'titleDesc' },
];

const FIELD =
  'rounded-md border border-line bg-surface-raised text-sm text-ink focus:border-accent focus:outline-none';

/** Thanh lọc: phân đoạn trạng thái, ô tìm kiếm, sắp xếp và nút chuyển Danh sách/Thẻ (spec mục 6). */
export function ListToolbar({
  status,
  counts,
  onStatusChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  onSearch,
}: ListToolbarProps) {
  const t = useTranslations('myCourses');
  const [text, setText] = useState('');

  const submit = () => onSearch(text.trim());
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip active={status === 'all'} onClick={() => onStatusChange('all')}>
          {`${t('filter.all')} (${counts.all})`}
        </Chip>
        <Chip active={status === 'in-progress'} onClick={() => onStatusChange('in-progress')}>
          {`${t('filter.inProgress')} (${counts['in-progress']})`}
        </Chip>
        <Chip active={status === 'completed'} onClick={() => onStatusChange('completed')}>
          {`${t('filter.completed')} (${counts.completed})`}
        </Chip>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <div className="flex">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('search.placeholder')}
            className={`${FIELD} w-44 rounded-r-none border-r-0 px-3 py-1.5 placeholder:text-ink-faint`}
          />
          <button
            type="button"
            onClick={submit}
            aria-label={t('search.aria')}
            className="flex items-center justify-center rounded-r-md border border-accent bg-accent px-2.5 text-white hover:bg-accent-dark"
          >
            <Search size={15} aria-hidden />
          </button>
        </div>

        <label htmlFor="my-courses-sort" className="text-sm text-ink-muted">
          {t('sort.label')}
        </label>
        <select
          id="my-courses-sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className={`${FIELD} px-2.5 py-1.5`}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {t(`sort.${s.key}` as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>

        <div className="flex rounded-md border border-line bg-surface-raised p-0.5">
          <button
            type="button"
            aria-label={t('view.list')}
            aria-pressed={view === 'list'}
            onClick={() => onViewChange('list')}
            className={`flex h-7 w-7 items-center justify-center rounded ${
              view === 'list' ? 'bg-tint text-accent-dark' : 'text-ink-muted hover:text-accent-dark'
            }`}
          >
            <List size={16} aria-hidden />
          </button>
          <button
            type="button"
            aria-label={t('view.grid')}
            aria-pressed={view === 'grid'}
            onClick={() => onViewChange('grid')}
            className={`flex h-7 w-7 items-center justify-center rounded ${
              view === 'grid' ? 'bg-tint text-accent-dark' : 'text-ink-muted hover:text-accent-dark'
            }`}
          >
            <LayoutGrid size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
