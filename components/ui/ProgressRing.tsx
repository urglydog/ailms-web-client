import { clampPct } from './ProgressBar';

interface ProgressRingProps {
  value: number;
  /** Nhãn cho trình đọc màn hình, ví dụ "Tiến độ khóa học". */
  label: string;
  size?: number;
  stroke?: number;
  className?: string;
}

/** Vòng tiến độ 0 đến 100 kèm số % ở giữa. Màu theo token (nền `line`, phần đầy `accent`). */
export function ProgressRing({ value, label, size = 32, stroke = 3, className = '' }: ProgressRingProps) {
  const pct = clampPct(value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-line" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="stroke-accent transition-[stroke-dashoffset] duration-slow ease-out motion-reduce:transition-none"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-ink" aria-hidden>
        {Math.round(pct)}
      </span>
    </span>
  );
}
