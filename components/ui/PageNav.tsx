'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { pageItems } from '@/lib/pagination';

interface PageNavProps {
  /** Trang hiện tại, đếm từ 1. */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  labels: { nav: string; prev: string; next: string; page: (n: number) => string };
  className?: string;
}

const CELL =
  'inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors duration-150';

/** Thanh phân trang có số trang (1 … 4 5 6 … 12), nút Trước/Sau; ẩn khi chỉ có 1 trang. */
export function PageNav({ page, totalPages, onChange, labels, className = '' }: PageNavProps) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={labels.nav} className={`flex items-center justify-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={labels.prev}
        className={`${CELL} text-ink hover:bg-tint disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <ChevronLeft size={18} aria-hidden />
      </button>
      {pageItems(page, totalPages).map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} aria-hidden className={`${CELL} text-ink-muted`}>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-label={labels.page(item)}
            aria-current={item === page ? 'page' : undefined}
            className={`${CELL} ${item === page ? 'bg-accent text-white' : 'text-ink hover:bg-tint'}`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label={labels.next}
        className={`${CELL} text-ink hover:bg-tint disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <ChevronRight size={18} aria-hidden />
      </button>
    </nav>
  );
}
