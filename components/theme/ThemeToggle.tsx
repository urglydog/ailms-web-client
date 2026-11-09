'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { THEME_STORAGE_KEY, resolveTheme, type ThemeMode } from '@/lib/theme/themeMode';

function readStored(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function prefersDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

/**
 * Trạng thái sáng/tối dùng chung cho nút ở header (khách) và mục trong menu avatar. Lớp `dark` đã được gắn sớm bởi THEME_INIT_SCRIPT (app/layout.tsx)
 * nên ở đây chỉ đọc lại trạng thái và lưu lựa chọn mới. Chưa chọn lần nào thì theo hệ điều hành.
 */
export function useThemeMode() {
  // null trong lần vẽ đầu để HTML server và client khớp nhau (server không biết theme).
  const [mode, setMode] = useState<ThemeMode | null>(null);

  useEffect(() => {
    setMode(resolveTheme(readStored(), prefersDark()));
  }, []);

  const toggle = () => {
    const next: ThemeMode = (mode ?? resolveTheme(readStored(), prefersDark())) === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* chế độ ẩn danh: vẫn đổi trong phiên hiện tại */
    }
    setMode(next);
  };

  return { mode, toggle };
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const t = useTranslations('header.theme');
  const { mode, toggle } = useThemeMode();
  const isDark = mode === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? t('toLight') : t('toDark')}
      title={isDark ? t('toLight') : t('toDark')}
      aria-pressed={isDark}
      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-surface text-ink transition-colors duration-150 hover:bg-surface-hover ${className}`}
    >
      {isDark ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
    </button>
  );
}
