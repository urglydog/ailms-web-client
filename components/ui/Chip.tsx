import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

/** Chip lọc dạng viên (spec mục 3.2: bo 99px). Chữ accent trên nền thường dùng accent-dark để đạt AA. */
export function Chip({ active = false, className = '', children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium
                  transition-colors duration-150 ease-soft
                  ${
                    active
                      ? 'border-accent bg-accent text-white'
                      : 'border-line bg-surface-raised text-ink-muted hover:border-accent hover:text-accent-dark'
                  } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
