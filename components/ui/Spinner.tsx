interface SpinnerProps {
  /** Đường kính tính bằng px */
  size?: number;
  className?: string;
}

export function Spinner({ size = 40, className = '' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Đang tải"
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 13)) }}
      className={`animate-ai-spin rounded-full border-line border-t-accent ${className}`}
    />
  );
}
