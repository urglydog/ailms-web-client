import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'ai' | 'highlight' | 'cyan';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-dark',
  secondary: 'border border-line bg-surface-raised text-accent-dark hover:border-accent',
  ghost: 'text-ink-muted hover:bg-line-soft hover:text-ink',
  /** Nút vàng nổi trên nền accent (vd "Học tiếp" trong khối Tiếp tục học). Chữ luôn là ink. */
  highlight: 'bg-highlight text-ink hover:brightness-95',
  /** Nút cyan dành riêng cho tính năng lồng tiếng AI. Chữ luôn là cyan-ink. */
  cyan: 'bg-cyan text-cyan-ink hover:brightness-95',
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
      className={`inline-flex items-center justify-center gap-2 rounded-md font-sans
                  font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 btn-tactile
                  ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
