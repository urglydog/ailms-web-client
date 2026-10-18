'use client';

import { LayoutGrid, List } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type CourseListView = 'grid' | 'list';

/** Nút chuyển giữa dạng thẻ và dạng danh sách của kho khóa học. */
export function ViewToggle({ view, onChange }: { view: CourseListView; onChange: (view: CourseListView) => void }) {
  const t = useTranslations('courseList.view');
  const base = 'flex h-8 w-8 items-center justify-center rounded-md transition-colors';
  const on = 'bg-accent text-white';
  const off = 'text-ink-muted hover:bg-tint hover:text-accent-dark';
  return (
    <div className="inline-flex gap-1 rounded-lg border border-line bg-surface-raised p-0.5">
      <button
        type="button"
        aria-label={t('grid')}
        aria-pressed={view === 'grid'}
        onClick={() => onChange('grid')}
        className={`${base} ${view === 'grid' ? on : off}`}
      >
        <LayoutGrid size={16} aria-hidden />
      </button>
      <button
        type="button"
        aria-label={t('list')}
        aria-pressed={view === 'list'}
        onClick={() => onChange('list')}
        className={`${base} ${view === 'list' ? on : off}`}
      >
        <List size={16} aria-hidden />
      </button>
    </div>
  );
}
