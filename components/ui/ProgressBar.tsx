type Tone = 'accent' | 'success' | 'onAccent';

interface ProgressBarProps {
  value: number;
  label: string;
  /** `onAccent`: đặt trên nền accent (khối "Tiếp tục học") — nền trắng mờ, phần đầy màu trắng. */
  tone?: Tone;
  className?: string;
}

const TRACK: Record<Tone, string> = {
  accent: 'bg-tint',
  success: 'bg-tint',
  onAccent: 'bg-white/30',
};

const FILL: Record<Tone, string> = {
  accent: 'bg-accent',
  success: 'bg-success',
  onAccent: 'bg-white',
};

export function clampPct(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, v));
}

/** Thanh tiến độ 0 đến 100. Chỉ động `transform: scaleX` (không động chiều rộng) — spec mục 9. */
export function ProgressBar({ value, label, tone = 'accent', className = '' }: ProgressBarProps) {
  const pct = clampPct(value);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={`h-1.5 w-full overflow-hidden rounded-full ${TRACK[tone]} ${className}`}
    >
      <div
        className={`h-full w-full origin-left rounded-full transition-transform duration-[900ms] ease-soft ${FILL[tone]}`}
        style={{ transform: `scaleX(${pct / 100})` }}
      />
    </div>
  );
}
