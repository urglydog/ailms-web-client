import type { ReactNode } from 'react';

export type MaterialBadgeTone = 'success' | 'neutral' | 'accent' | 'warning' | 'danger';

const TONES: Record<MaterialBadgeTone, string> = {
  success: 'bg-success/10 text-success border border-success/20',
  neutral: 'bg-line-soft text-ink-muted border border-line',
  accent: 'bg-accent/10 text-accent border border-accent/20',
  warning: 'bg-star/10 text-star border border-star/20',
  danger: 'bg-danger/10 text-danger border border-danger/20',
};

interface MaterialBadgeProps {
  children: ReactNode;
  tone?: MaterialBadgeTone;
  icon?: ReactNode;
  className?: string;
}

/**
 * Badge dùng chung riêng cho khu vực Học liệu (giảng viên + học viên) — chỉ 5 tông màu
 * hệ thống (`accent`/`success`/`warning`/`danger`/`neutral`), nền nhạt + viền cùng tông,
 * bo góc `rounded-card` (8px, đúng "Enterprise/Academic Design System" của dự án).
 * Tách riêng khỏi `components/ui/Badge` (dùng cho Course listing/Admin) để không ảnh
 * hưởng các màn hình ngoài phạm vi cải tổ Học liệu.
 */
export function MaterialBadge({ children, tone = 'neutral', icon, className = '' }: MaterialBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-card px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
