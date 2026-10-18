'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatShortDate } from '@/lib/instructorInsights';
import { formatMoney } from '@/lib/shop/money';

/** Biểu đồ cột doanh thu theo ngày bằng div (không cần thư viện); cột cao nhất chiếm 100% chiều cao, ngày không có doanh thu
 * vẫn có vạch mỏng 2px. Không có doanh thu nào thì hiện lời báo trống. Mô tả tổng và ngày cao nhất qua aria-label. */
export function RevenueBars({ series }: { series: ReadonlyArray<{ day: string; value: number }> }) {
  const t = useTranslations('instructor.performance.overview.chart');
  const locale = useLocale();
  const total = series.reduce((sum, p) => sum + p.value, 0);
  const peak = series.reduce((best, p) => (p.value > best.value ? p : best), { day: '', value: 0 });

  if (total === 0) return <p className="m-0 text-sm text-ink-muted">{t('empty')}</p>;

  return (
    <div>
      <div
        role="img"
        aria-label={t('aria', { total: formatMoney(total, locale), peak: formatMoney(peak.value, locale) })}
        className="flex h-40 items-end gap-[3px]"
      >
        {series.map((p) => (
          <div
            key={p.day}
            data-testid="bar"
            title={`${formatShortDate(p.day)}: ${formatMoney(p.value, locale)}`}
            style={{ height: p.value === 0 ? '2px' : `${(p.value / peak.value) * 100}%` }}
            className={`flex-1 rounded-t-sm ${p.value === 0 ? 'bg-line' : 'bg-accent'}`}
          />
        ))}
      </div>
      <div aria-hidden className="mt-1.5 flex justify-between text-[11px] text-ink-muted">
        <span>{series[0] ? formatShortDate(series[0].day) : ''}</span>
        <span>{series[series.length - 1] ? formatShortDate(series[series.length - 1]!.day) : ''}</span>
      </div>
    </div>
  );
}
