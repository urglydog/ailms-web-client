import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: { href: string; label: string };
}

/** Trạng thái trống dùng chung của Kênh giảng viên: biểu tượng, tiêu đề, mô tả ngắn và (tùy chọn) hành động dẫn đi tạo mới. */
export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tint text-accent">
        <Icon size={22} aria-hidden />
      </span>
      <p className="m-0 font-display text-lg font-semibold text-ink">{title}</p>
      {body && <p className="m-0 max-w-sm text-sm text-ink-muted">{body}</p>}
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
