import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Nút hoặc liên kết hành động chính, đặt bên phải. */
  action?: ReactNode;
}

/** Đầu trang chuẩn của các trang Kênh giảng viên: tiêu đề h1, mô tả ngắn và hành động chính. */
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="m-0 font-display text-[22px] font-bold text-ink">{title}</h1>
        {subtitle && <p className="m-0 mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
