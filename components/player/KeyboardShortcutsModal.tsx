'use client';

import { useTranslations } from 'next-intl';

/**
 * Danh sách phím tắt bàn phím — giao diện tham khảo Udemy (06/09/2026). Chỉ liệt kê phím tắt
 * THẬT SỰ đã cài (xử lý trong `DualPlayer.tsx`) — không liệt kê các mục Udemy có nhưng project
 * này chưa có tính năng tương ứng (ghi chú bài học, thông tin nội dung...) để tránh gây hiểu lầm
 * có tính năng không tồn tại.
 */

interface ShortcutItem {
  keys: string[];
  labelKey: string;
}

const LEFT_SHORTCUTS: ShortcutItem[] = [
  { keys: ['Space'], labelKey: 'playPause' },
  { keys: ['Shift', '←'], labelKey: 'slower' },
  { keys: ['Shift', '→'], labelKey: 'faster' },
  { keys: ['F'], labelKey: 'fullscreen' },
  { keys: ['Esc'], labelKey: 'exitFullscreen' },
];

const RIGHT_SHORTCUTS: ShortcutItem[] = [
  { keys: ['←'], labelKey: 'back5' },
  { keys: ['→'], labelKey: 'forward5' },
  { keys: ['↑'], labelKey: 'volumeUp' },
  { keys: ['↓'], labelKey: 'volumeDown' },
  { keys: ['M'], labelKey: 'mute' },
];

function KeyCap({ children }: { children: string }) {
  return (
    <span className="rounded-md border border-white/25 bg-white/10 px-2.5 py-1 text-[13px] font-semibold text-white">
      {children}
    </span>
  );
}

function ShortcutRow({ item }: { item: ShortcutItem }) {
  const t = useTranslations('learn.player.shortcuts');
  return (
    <div className="flex items-center justify-between gap-6 py-2.5">
      <span className="text-[14px] text-white/90">{t(item.labelKey)}</span>
      <span className="flex shrink-0 items-center gap-1.5">
        {item.keys.map((k, i) => (
          <span key={k} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-white/40">+</span>}
            <KeyCap>{k}</KeyCap>
          </span>
        ))}
      </span>
    </div>
  );
}

export function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('learn.player.shortcuts');
  return (
    <div className="absolute inset-0 z-30 flex flex-col overflow-y-auto bg-ink/95 p-6 text-white">
      <button
        type="button"
        onClick={onClose}
        aria-label={t('close')}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <h2 className="mb-6 text-center font-display text-lg font-bold">{t('title')}</h2>

      <div className="mx-auto grid w-full max-w-xl grid-cols-1 gap-x-12 sm:grid-cols-2">
        <div className="divide-y divide-white/10">
          {LEFT_SHORTCUTS.map((s) => (
            <ShortcutRow key={s.labelKey} item={s} />
          ))}
        </div>
        <div className="divide-y divide-white/10">
          {RIGHT_SHORTCUTS.map((s) => (
            <ShortcutRow key={s.labelKey} item={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
