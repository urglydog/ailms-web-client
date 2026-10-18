'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CompletionMeterProps {
  percent: number;
  /** Điều kiện gửi duyệt còn thiếu (do máy chủ trả về). */
  missing: string[];
}

/** Thanh tiến độ hoàn thiện khóa học ở thanh trên trình chỉnh sửa; bấm để xem các điều kiện còn thiếu. */
export function CompletionMeter({ percent, missing }: CompletionMeterProps) {
  const t = useTranslations('instructor.edit.completion');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const done = percent >= 100 && missing.length === 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-success-ink">
        <CheckCircle2 size={16} aria-hidden />
        {t('ready')}
      </span>
    );
  }

  return (
    <div ref={rootRef} className="relative flex w-40 flex-col gap-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center justify-between text-[12.5px] font-semibold text-ink hover:text-accent-dark"
      >
        {t('label', { percent })}
        <ChevronDown size={14} aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        role="progressbar"
        aria-label={t('aria', { percent })}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1.5 w-full overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>

      {open && (
        <div className="absolute left-0 top-full z-[200] mt-2 w-72 rounded-panel border border-line bg-white p-3 shadow-card-hover">
          <p className="m-0 mb-1.5 text-[12px] font-bold uppercase tracking-wide text-ink-muted">{t('missingTitle')}</p>
          <ul className="m-0 flex list-disc flex-col gap-1 pl-4 text-[13px] text-ink">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
