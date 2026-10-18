'use client';

import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatBytes, formatUptime, usagePercent, usageTone, type UsageTone } from '@/lib/admin/overview';

export interface SystemMetrics {
  ram: { used: number; total: number };
  disk: { used: number; total: number };
  uptime: number;
}

const BAR_COLOR: Record<UsageTone, string> = { ok: 'bg-success', warn: 'bg-warning', critical: 'bg-danger' };

function UsageBar({ label, used, total }: { label: string; used: number; total: number }) {
  const percent = usagePercent(used, total);
  const tone = usageTone(used, total);
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs text-ink-muted">
        <span>{label}</span>
        <span className="font-medium text-ink">
          {formatBytes(used)} / {formatBytes(total)} ({percent}%)
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        data-tone={tone}
        className="h-2 w-full overflow-hidden rounded-full bg-tint"
      >
        <div className={`h-full rounded-full ${BAR_COLOR[tone]}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/** Thẻ tình trạng máy chủ: RAM JVM, ổ đĩa (đổi màu theo mức dùng) và thời gian chạy; nút làm mới thủ công. */
export function SystemHealth({ metrics, onRefresh }: { metrics: SystemMetrics | undefined; onRefresh: () => void }) {
  const t = useTranslations('admin.overview.health');
  return (
    <section aria-labelledby="system-health-title" className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="system-health-title" className="m-0 font-display text-[15px] font-bold text-ink">
          {t('title')}
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg bg-tint px-2.5 py-1.5 text-xs font-semibold text-accent-dark hover:bg-line"
        >
          <RefreshCw size={13} aria-hidden />
          {t('refresh')}
        </button>
      </div>
      {metrics ? (
        <div className="flex flex-col gap-4">
          <UsageBar label={t('ram')} used={metrics.ram.used} total={metrics.ram.total} />
          <UsageBar label={t('disk')} used={metrics.disk.used} total={metrics.disk.total} />
          <div className="flex items-center justify-between border-t border-line-soft pt-3">
            <span className="text-xs text-ink-muted">{t('uptime')}</span>
            <span className="text-sm font-semibold text-ink">{formatUptime(metrics.uptime)}</span>
          </div>
        </div>
      ) : (
        <div className="flex h-[150px] items-center justify-center text-sm text-ink-muted">{t('loading')}</div>
      )}
    </section>
  );
}
