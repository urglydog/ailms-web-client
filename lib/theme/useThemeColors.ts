'use client';

import { useEffect, useState } from 'react';
import { COLORS, DARK_COLORS, type ColorToken } from './colors';

const isDark = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

/**
 * Bảng màu hiện hành (sáng/tối) cho nơi cần mã màu thật thay vì lớp Tailwind — chủ yếu là
 * thuộc tính SVG của biểu đồ (Recharts `stroke`/`fill`), vốn không nhận `var(--…)`.
 * Tự cập nhật khi lớp `dark` trên <html> đổi (nút đổi giao diện).
 */
export function useThemeColors(): Record<ColorToken, string> {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(isDark());
    const observer = new MutationObserver(() => setDark(isDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return dark ? DARK_COLORS : COLORS;
}
