interface SkeletonProps {
  className?: string;
}

/** Ô xám nhấp nháy khi đang tải. Dùng đúng kích thước thật để tránh layout shift. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}
