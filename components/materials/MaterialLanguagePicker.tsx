'use client';

import { useEffect, useRef, useState } from 'react';
import type { LanguageAvailability } from '@/lib/api/materials';

/**
 * Chọn ngôn ngữ đầu ra cho Mindmap/Flashcard/Quiz (UC24) — cùng kiểu hiển thị với
 * `components/player/LanguageDropdown.tsx` (dropdown lồng tiếng) theo đúng yêu cầu "cho chọn
 * full ngôn ngữ giống dubbing, ngôn ngữ nào có dịch sẵn thì dấu tích, chưa thì dấu chấm".
 *
 * Khác `LanguageDropdown`: KHÔNG có ngôn ngữ nào bị vô hiệu hoá (BR-DUB-09 chỉ áp dụng cho lồng
 * tiếng) — BR-MAT-01 cho chọn ngôn ngữ đầu ra hoàn toàn tự do, kể cả trùng ngôn ngữ gốc của bài
 * giảng. Dấu tích/chấm ở đây chỉ là gợi ý "đã có bản dịch sẵn hay chưa" (nhanh hơn hay chậm hơn
 * một chút), không giới hạn lựa chọn.
 */
interface MaterialLanguagePickerProps {
  languages: LanguageAvailability[];
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

export function MaterialLanguagePicker({ languages, value, onChange, disabled }: MaterialLanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const active = languages.find((l) => l.code === value) ?? null;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredLanguages = normalizedQuery
    ? languages.filter(
        (l) => l.label.toLowerCase().includes(normalizedQuery) || l.code.toLowerCase().includes(normalizedQuery),
      )
    : languages;

  useEffect(() => {
    if (!open) return;
    setQuery('');
    searchInputRef.current?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handlePick = (lang: LanguageAvailability) => {
    onChange(lang.code);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative" role="group" aria-label="Chọn ngôn ngữ học liệu">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || languages.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-line bg-white px-3 py-2
                   text-sm text-ink transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {active ? (
          <span className="flex items-center gap-2">
            <span>{active.label}</span>
            {active.available ? (
              <span className="text-success" aria-hidden>✓</span>
            ) : (
              <span className="h-1.5 w-1.5 animate-ai-pulse rounded-full bg-star" aria-label="Chưa có bản dịch sẵn" />
            )}
          </span>
        ) : (
          <span className="text-ink-faint">{languages.length === 0 ? 'Chưa có transcript' : 'Chọn ngôn ngữ'}</span>
        )}
        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden className={`shrink-0 text-ink-faint transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && languages.length > 0 && (
        <div className="absolute z-20 mt-1 w-full min-w-[220px] overflow-hidden rounded-card border border-line bg-white shadow-card-hover">
          <div className="border-b border-line-soft p-2">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm ngôn ngữ…"
              aria-label="Tìm ngôn ngữ"
              className="w-full rounded-full border border-line bg-surface px-3 py-1.5 text-[13px]
                         text-ink outline-none placeholder:text-ink-faint focus:border-accent"
            />
          </div>
          <ul role="listbox" aria-label="Danh sách ngôn ngữ" className="max-h-64 overflow-y-auto py-1">
            {filteredLanguages.length === 0 && (
              <li className="px-4 py-3 text-center text-[13px] text-ink-faint">Không tìm thấy ngôn ngữ nào</li>
            )}
            {filteredLanguages.map((lang) => {
              const isActive = lang.code === value;
              return (
                <li key={lang.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handlePick(lang)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm ${
                      isActive ? 'bg-accent/10 font-semibold text-accent' : 'text-ink hover:bg-surface'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {lang.available ? (
                      <span className="text-success" aria-label="Đã có bản dịch sẵn">✓</span>
                    ) : (
                      <span className="h-1.5 w-1.5 shrink-0 animate-ai-pulse rounded-full bg-star" aria-label="Chưa có bản dịch sẵn" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
