'use client';

import { useTranslations } from 'next-intl';
import type { FinanceSummary } from '@/types/finance';
import { dateOnly, money } from '@/lib/finance';

function Card({ label, value, hint, strong }: { label: string; value: string; hint: string; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface-raised p-4 shadow-sm">
      <span className="text-xs font-semibold text-ink-muted">{label}</span>
      <span className={`font-display text-2xl font-bold ${strong ? 'text-accent-dark' : 'text-ink'}`}>{value}</span>
      <span className="text-xs text-ink-muted">{hint}</span>
    </div>
  );
}

/** Số dư thu nhập: có thể rút / đang giữ / đóng băng / đã nhận (11/11/2026, Giai đoạn C). */
export function BalanceCards({ summary }: { summary: FinanceSummary }) {
  const t = useTranslations('instructor.balance');
  return (
    <div className="flex flex-col gap-3">
      {!summary.cryptoConfigured && (
        <div role="alert" className="rounded-xl border border-warning bg-surface-raised p-4 text-sm text-ink">
          {t('noCrypto')}
        </div>
      )}
      {summary.available < 0 && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-4 text-sm text-ink">
          {t('negative', { amount: money(Math.abs(summary.available)) })}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label={t('withdrawable')} value={money(summary.withdrawable)} hint={t('nextPayout', { date: dateOnly(summary.nextPayoutDate) })} strong />
        <Card label={t('holding')} value={money(summary.pending)} hint={t('holdingHint')} />
        <Card label={t('frozen')} value={money(summary.frozen)} hint={t('frozenHint')} />
        <Card label={t('paidOut')} value={money(summary.paidOut)} hint={t('paidOutHint')} />
      </div>
    </div>
  );
}
