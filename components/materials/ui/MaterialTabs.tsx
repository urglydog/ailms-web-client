'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export interface MaterialTabItem {
  key: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface MaterialTabsProps {
  tabs: MaterialTabItem[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

/**
 * Tab dùng chung cho khu vực Học liệu — có thanh trượt (sliding indicator) chuyển động
 * mượt bằng CSS thuần (`transition-all`, không cần framer-motion), thay cho kiểu tab
 * đổi màu tĩnh đang dùng rải rác trong dự án.
 */
export function MaterialTabs({ tabs, active, onChange, className = '' }: MaterialTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const recalc = () => {
      const container = containerRef.current;
      if (!container) return;
      const activeEl = container.querySelector<HTMLButtonElement>(`[data-tab-key="${active}"]`);
      if (activeEl) {
        setIndicator({ left: activeEl.offsetLeft, width: activeEl.offsetWidth });
      }
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [active, tabs]);

  useEffect(() => {
    // Lần render đầu chưa có kích thước layout — recalc lại 1 nhịp sau khi mount.
    const id = requestAnimationFrame(() => {
      const container = containerRef.current;
      const activeEl = container?.querySelector<HTMLButtonElement>(`[data-tab-key="${active}"]`);
      if (activeEl) setIndicator({ left: activeEl.offsetLeft, width: activeEl.offsetWidth });
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center gap-1 rounded-card bg-surface border border-line p-1 ${className}`}
    >
      {indicator && (
        <div
          className="absolute top-1 bottom-1 rounded-card bg-accent transition-[left,width] duration-200 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {tabs.map(tab => (
        <button
          key={tab.key}
          type="button"
          data-tab-key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-card transition-colors duration-200 ${
            active === tab.key ? 'text-white' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={active === tab.key ? 'text-white/80' : 'text-ink-faint'}>({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
