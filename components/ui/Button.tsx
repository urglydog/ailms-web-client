import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'ai';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-dark',
  secondary: 'border border-line bg-surface-raised text-ink hover:border-accent hover:text-accent',
  ghost: 'text-ink-muted hover:bg-line-soft hover:text-ink',
  /**
   * Nút kích hoạt tính năng AI. Hiệu ứng glow là tín hiệu thị giác riêng cho
   * "AI đang xử lý" của design — chỉ dùng cho hành động AI, không dùng tràn lan.
   */
  ai: 'bg-accent text-white animate-ai-glow hover:bg-accent-dark',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-display
                  font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50
                  ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
