'use client';

import type { FormEvent, ReactNode } from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  /** Bộ lọc phụ (chọn trạng thái, loại, ngày...) đặt cạnh ô tìm kiếm. */
  filters?: ReactNode;
  busy?: boolean;
}

/** Khung tra cứu dùng chung cho các màn quản lý dữ liệu lớn: chỉ có ô nhập (+ bộ lọc phụ); kết quả chỉ hiện sau khi bấm Tìm. */
export function SearchPanel({ label, placeholder, value, onChange, onSubmit, filters, busy = false }: Props) {
  const t = useTranslations('common.search');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface-raised p-4">
      <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-72">
        <span className="text-xs font-semibold text-ink-muted">{label}</span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
        />
      </label>
      {filters}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
      >
        <Search size={15} aria-hidden />
        {busy ? t('searching') : t('search')}
      </button>
    </form>
  );
}

/** Trạng thái ban đầu của màn tra cứu: hướng dẫn nhập gì để bắt đầu, thay cho việc liệt kê toàn bộ dữ liệu. */
export function SearchPrompt({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line bg-surface-raised px-6 py-12 text-center">
      <Search size={28} className="text-ink-muted" aria-hidden />
      <p className="m-0 font-display text-base font-bold text-ink">{title}</p>
      <p className="m-0 max-w-xl text-sm text-ink-muted">{children}</p>
    </div>
  );
}

interface PagerProps {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}

/** Phân trang đơn giản: trang hiện tại bắt đầu từ 0. */
export function Pager({ page, totalPages, total, onPage }: PagerProps) {
  const t = useTranslations('common.search');
  if (totalPages <= 1) {
    return <p className="m-0 px-1 text-sm text-ink-muted">{t('results', { total })}</p>;
  }
  return (
    <nav aria-label={t('pagination')} className="flex flex-wrap items-center justify-between gap-3 px-1">
      <span className="text-sm text-ink-muted">{t('resultsPage', { total, page: page + 1, pages: totalPages })}</span>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page === 0} onClick={() => onPage(page - 1)}
          className="rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-sm font-semibold text-ink hover:bg-tint disabled:opacity-50">{t('prev')}</button>
        <button type="button" disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)}
          className="rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-sm font-semibold text-ink hover:bg-tint disabled:opacity-50">{t('next')}</button>
      </div>
    </nav>
  );
}
