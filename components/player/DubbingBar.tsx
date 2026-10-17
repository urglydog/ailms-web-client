'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Languages, Loader2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  filterLanguages,
  languageStatus,
  languageToUseWhenOriginalOff,
  sortLanguagesForMenu,
} from '@/lib/learn/dubbing';
import type { DubLanguage } from '@/types/domain';

interface DubbingBarProps {
  languages: DubLanguage[];
  /** Mã ngôn ngữ giọng lồng tiếng đang nghe; null = nghe âm thanh gốc. */
  activeCode: string | null;
  sourceLanguage: string | null;
  /** Job lồng tiếng đang chạy (chỉ theo dõi được một job qua WebSocket), kèm phần trăm. */
  processing: { code: string; percent: number } | null;
  onSelect: (code: string) => void;
  onUseOriginal: () => void;
}

/**
 * Thanh chọn giọng lồng tiếng AI đặt NGAY DƯỚI video (spec mục 7): nút lớn viền cyan hiện giọng đang nghe
 * và công tắc "Nghe bản gốc". Menu liệt kê trạng thái từng ngôn ngữ (Sẵn sàng / Đang tạo N% / Tạo giọng);
 * chọn ngôn ngữ chưa có sẽ mở panel kích hoạt (UC18) ở trang cha. Ngôn ngữ trùng ngôn ngữ gốc bị vô hiệu
 * (BR-DUB-09). Danh sách luôn đến từ `voice_mappings` đang active (BR-DUB-07), không ghi cứng ở frontend.
 */
export function DubbingBar({ languages, activeCode, sourceLanguage, processing, onSelect, onUseOriginal }: DubbingBarProps) {
  const t = useTranslations('learn.dubbing');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const lastCodeRef = useRef<string | null>(null);

  const active = languages.find((l) => l.code === activeCode) ?? null;
  const visible = filterLanguages(
    sortLanguagesForMenu(languages, { sourceLanguage, processingCode: processing?.code ?? null }),
    query,
  );
  const usingOriginal = activeCode === null;

  useEffect(() => {
    if (activeCode) lastCodeRef.current = activeCode;
  }, [activeCode]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    searchRef.current?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const pick = (lang: DubLanguage) => {
    if (lang.code === sourceLanguage) return;
    onSelect(lang.code);
    setOpen(false);
  };

  const toggleOriginal = () => {
    if (!usingOriginal) {
      onUseOriginal();
      return;
    }
    const code = languageToUseWhenOriginalOff(languages, sourceLanguage, lastCodeRef.current);
    if (code) onSelect(code);
    else setOpen(true);
  };

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={t('groupAria')}
      className="relative flex flex-wrap items-center gap-3 rounded-panel border border-line bg-surface-raised p-2.5"
    >
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-lg border-[1.5px] border-cyan bg-surface-raised px-3 py-2 text-left transition-colors duration-150 hover:border-accent"
      >
        <Languages size={18} aria-hidden className="shrink-0 text-accent" />
        <span className="flex flex-col leading-tight">
          <span className="text-[11px] text-ink-muted">{t('label')}</span>
          <span className="text-[13px] font-medium text-ink">{active ? active.label : t('original')}</span>
        </span>
        <ChevronDown size={14} aria-hidden className={`text-ink-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      <button
        type="button"
        role="switch"
        aria-checked={usingOriginal}
        onClick={toggleOriginal}
        className="ml-auto flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-ink-muted hover:text-ink"
      >
        <span>{t('listenOriginal')}</span>
        <span
          aria-hidden
          className={`relative h-[18px] w-8 rounded-full transition-colors duration-200 ${usingOriginal ? 'bg-accent' : 'bg-line'}`}
        >
          <span
            className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-[left] duration-200 ${
              usingOriginal ? 'left-[16px]' : 'left-0.5'
            }`}
          />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-[280px] overflow-hidden rounded-panel border border-line bg-surface-raised shadow-card-hover">
          <div className="border-b border-line-soft p-2">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchAria')}
              className="w-full rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-accent"
            />
          </div>
          <ul role="listbox" aria-label={t('listAria')} className="m-0 max-h-72 list-none overflow-y-auto p-1">
            {visible.length === 0 && <li className="px-3 py-3 text-center text-[13px] text-ink-muted">{t('noResults')}</li>}
            {visible.map((lang) => {
              const status = languageStatus(lang, { sourceLanguage, processingCode: processing?.code ?? null });
              const isActive = lang.code === activeCode;
              return (
                <li key={lang.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    disabled={status === 'original-source'}
                    title={status === 'original-source' ? t('sourceTitle') : undefined}
                    onClick={() => pick(lang)}
                    className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-[13px] ${
                      status === 'original-source'
                        ? 'cursor-not-allowed text-ink-faint'
                        : isActive
                          ? 'bg-tint font-medium text-accent-dark'
                          : 'text-ink hover:bg-tint'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {lang.flag && <span aria-hidden>{lang.flag}</span>}
                      {lang.label}
                    </span>
                    {status === 'original-source' && <span className="shrink-0 whitespace-nowrap text-[11px]">{t('sourceTag')}</span>}
                    {status === 'ready' && (
                      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] text-success-ink">
                        <Check size={13} aria-hidden />
                        {t('ready')}
                      </span>
                    )}
                    {status === 'processing' && (
                      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-streak-bg px-2 py-0.5 text-[11px] text-streak-ink">
                        <Loader2 size={12} aria-hidden className="animate-spin" />
                        {t('processing', { percent: processing?.percent ?? 0 })}
                      </span>
                    )}
                    {status === 'none' && (
                      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] text-accent-dark">
                        <Plus size={13} aria-hidden />
                        {t('create')}
                      </span>
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
