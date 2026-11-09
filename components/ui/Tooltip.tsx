'use client';

import { useState, type ReactNode } from 'react';

/**
 * Tooltip icon-toolbar gọn kiểu GitHub "Add a comment" — chỉ nhận nhãn ngắn (1-2 từ), hiện gần
 * như tức thì khi hover/focus (không có độ trễ ~1s như `title=` gốc của trình duyệt).
 */
export function Tooltip({ label, children, side = 'top', className = '' }: {
  label: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-semibold text-white shadow-card transition-opacity duration-100 ${
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        } ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        {label}
      </span>
    </span>
  );
}
