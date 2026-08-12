'use client';

import { useEffect, useRef, useState } from 'react';
import type { DubLanguage } from '@/types/domain';

/**
 * Chọn ngôn ngữ lồng tiếng — UC17. Dạng dropdown đặt DƯỚI video (thay vì hàng pill phía
 * trên như trước) để video luôn là điểm nhìn đầu tiên và không tranh chỗ theo chiều dọc.
 *
 * Danh sách ngôn ngữ luôn đến từ bảng `voice_mappings` đang `is_active` (BR-DUB-07),
 * KHÔNG hardcode ở frontend.
 *
 * Ngôn ngữ `available = false` vẫn bấm chọn được (mở panel kích hoạt lồng tiếng, UC18) —
 * chỉ khác nhau ở dấu hiệu trực quan: ✓ xanh khi đã có bản lồng tiếng, chấm nhấp nháy khi
 * chưa (tái dùng đúng màu `bg-star`/`animate-ai-pulse` đã dùng ở `Pill.tsx` để nhất quán).
 *
 * BR-DUB-09: ngôn ngữ trùng `sourceLanguage` của video bị vô hiệu hoá — không cho tạo job.
 */

interface LanguageDropdownProps {
  languages: DubLanguage[];
  activeCode: string | null;
  sourceLanguage: string | null;
  onSelect: (code: string) => void;
}

export function LanguageDropdown({ languages, activeCode, sourceLanguage, onSelect }: LanguageDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const active = languages.find((l) => l.code === activeCode) ?? null;

  useEffect(() => {
    if (!open) return;
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

  const handlePick = (lang: DubLanguage) => {
    if (lang.code === sourceLanguage) return; // BR-DUB-09 — vẫn chặn chọn ngôn ngữ gốc
    onSelect(lang.code);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block" role="group" aria-label="Chọn ngôn ngữ lồng tiếng">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line bg-surface-raised px-4 py-2.5
                   text-sm font-medium text-ink shadow-card transition-colors hover:border-accent"
      >
        {active ? (
          <span className="flex items-center gap-2">
            <span aria-hidden>{active.flag}</span>
            <span>{active.label}</span>
            {active.available ? (
              <span className="text-success" aria-hidden>
                ✓
              </span>
            ) : (
              <span
                className="h-1.5 w-1.5 animate-ai-pulse rounded-full bg-star"
                aria-label="Chưa có bản lồng tiếng"
              />
            )}
          </span>
        ) : (
          <span className="text-ink-muted">🌐 Âm thanh gốc</span>
        )}
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          aria-hidden
          className={`text-ink-faint transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Danh sách ngôn ngữ"
          className="absolute z-20 mt-2 min-w-[220px] overflow-hidden rounded-card border border-line
                     bg-surface-raised py-1 shadow-card-hover"
        >
          {languages.map((lang) => {
            const isSource = lang.code === sourceLanguage;
            const isActive = lang.code === activeCode;
            return (
              <li key={lang.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  disabled={isSource}
                  title={isSource ? 'Bài giảng này vốn đã sử dụng ngôn ngữ bạn chọn' : undefined}
                  onClick={() => handlePick(lang)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm ${
                    isSource
                      ? 'cursor-not-allowed text-ink-faint opacity-60'
                      : isActive
                        ? 'bg-accent/10 font-semibold text-accent'
                        : 'text-ink hover:bg-surface'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{lang.flag}</span>
                    {lang.label}
                    {isSource && <span className="text-[11px]">(gốc)</span>}
                  </span>
                  {!isSource &&
                    (lang.available ? (
                      <span className="text-success" aria-label="Đã có bản lồng tiếng">
                        ✓
                      </span>
                    ) : (
                      <span
                        className="h-1.5 w-1.5 shrink-0 animate-ai-pulse rounded-full bg-star"
                        aria-label="Chưa có bản lồng tiếng"
                      />
                    ))}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
