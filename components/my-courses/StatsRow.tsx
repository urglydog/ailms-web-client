'use client';

import { Award, Flame, Play } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

function Stat({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: LucideIcon;
  tone: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-surface-raised px-3 py-2.5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={18} aria-hidden />
      </span>
      <span>
        <span className="block font-display text-lg font-semibold leading-tight text-ink">{value}</span>
        <span className="block text-[11px] text-ink-muted">{label}</span>
      </span>
    </div>
  );
}

/** Ba ô thống kê ngắn đầu trang Khóa học của tôi: chuỗi học, số khóa đang học, số chứng chỉ (spec mục 6). */
export function StatsRow({
  streak,
  inProgress,
  certificates,
}: {
  streak: number;
  inProgress: number;
  certificates: number;
}) {
  const t = useTranslations('myCourses.stats');
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      <Stat icon={Flame} tone="bg-streak-bg text-streak-ink" value={t('streakDays', { n: streak })} label={t('streak')} />
      <Stat icon={Play} tone="bg-tint text-accent-dark" value={String(inProgress)} label={t('inProgress')} />
      <Stat
        icon={Award}
        tone="bg-success-tint text-success-ink"
        value={String(certificates)}
        label={t('certificates')}
      />
    </div>
  );
}
