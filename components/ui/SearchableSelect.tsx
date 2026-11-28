'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown, Search } from 'lucide-react';

export interface SearchableOption {
  value: number;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

/** Bỏ dấu + hạ chữ thường để tìm "tieng anh" ra "Tiếng Anh" (đ/Đ không tách được bằng NFD nên đổi tay). */
const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

/**
 * Hộp chọn có ô tìm nhanh (không phụ thuộc thư viện ngoài): danh sách dài vẫn chọn được bằng cách gõ vài chữ, tìm không phân biệt
 * dấu/hoa thường. Danh sách xổ ra có chiều cao tối đa cố định và tự cuộn bên trong, không kéo dài trang.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder: searchPlaceholderProp,
  emptyText: emptyTextProp,
}: SearchableSelectProps) {
  const t = useTranslations('common.select');
  const searchPlaceholder = searchPlaceholderProp ?? t('searchPlaceholder');
  const emptyText = emptyTextProp ?? t('empty');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = fold(query.trim());
    return q ? options.filter((o) => fold(o.label).includes(q)) : options;
  }, [options, query]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          setQuery('');
        }}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface-raised p-2.5 text-left text-sm text-ink outline-none focus:border-accent"
      >
        <span className={`truncate ${selected ? '' : 'text-ink-muted'}`}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} aria-hidden className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 rounded-lg border border-line bg-surface-raised p-2 shadow-card-hover">
          <label className="mb-2 flex items-center gap-2 rounded-md border border-line px-2 py-1.5">
            <Search size={14} aria-hidden className="text-ink-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full bg-transparent text-sm text-ink outline-none"
            />
          </label>
          <ul role="listbox" className="m-0 max-h-56 list-none overflow-y-auto p-0">
            {filtered.length === 0 ? (
              <li className="px-2 py-3 text-center text-xs text-ink-muted">{emptyText}</li>
            ) : (
              filtered.map((o) => (
                <li key={o.value} role="option" aria-selected={o.value === value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm text-ink hover:bg-tint"
                  >
                    <span className="truncate">{o.label}</span>
                    {o.value === value && <Check size={14} aria-hidden className="shrink-0 text-accent" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
