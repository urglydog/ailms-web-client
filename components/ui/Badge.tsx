import type { ReactNode } from 'react';

type Tone = 'success' | 'neutral' | 'accent' | 'warning';

const TONES: Record<Tone, string> = {
  success: 'bg-success text-white',
  neutral: 'bg-line-soft text-ink-muted',
  accent: 'bg-accent text-white',
  warning: 'bg-star text-white',
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

export function Badge({ children, tone = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold
                  ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
