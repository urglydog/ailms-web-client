'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Pager } from '@/components/ui/SearchPanel';
import { useLedger } from '@/hooks/useFinance';
import { dateOnly, dateTime, ledgerNote, money } from '@/lib/finance';

const GROUPS = ['ALL', 'EARNING', 'REFUND', 'PAYOUT', 'DEBT', 'ADJUSTMENT'] as const;
const PAGE_SIZE = 10;

/** Sao kê sổ cái: từng khoản cộng/trừ vào thu nhập; lọc theo loại khoản và khoảng ngày, phân trang 10 dòng (phía máy chủ). */
export function LedgerTable() {
  const t = useTranslations('finance');
  const [group, setGroup] = useState<string>('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const { data, isLoading } = useLedger({ group, from, to, page });
  const rows = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const filtered = group !== 'ALL' || !!from || !!to;
  const input = 'rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent';

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
      <h2 className="m-0 font-display text-base font-bold text-ink">{t('ledger.title')}</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">{t('ledger.group')}</span>
          <select
            value={group}
            onChange={(e) => {
              setGroup(e.target.value);
              setPage(0);
            }}
            className={input}
          >
            {GROUPS.map((g) => (
              <option key={g} value={g}>{t(`ledger.group${g}`)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">{t('ledger.from')}</span>
          <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(0); }} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">{t('ledger.to')}</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(0); }} className={input} />
        </label>
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setGroup('ALL');
              setFrom('');
              setTo('');
              setPage(0);
            }}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-accent-dark hover:bg-tint"
          >
            {t('ledger.clear')}
          </button>
        )}
      </div>
      {isLoading && !data ? (
        <p className="m-0 text-sm text-ink-muted">{t('ledger.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="m-0 text-sm text-ink-muted">{filtered ? t('ledger.noMatch') : t('ledger.empty')}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-line text-xs text-ink-muted">
                <tr>
                  <th className="py-2 pr-3 font-semibold">{t('ledger.colTime')}</th>
                  <th className="py-2 pr-3 font-semibold">{t('ledger.colType')}</th>
                  <th className="py-2 pr-3 font-semibold">{t('ledger.colNote')}</th>
                  <th className="py-2 pr-3 font-semibold">{t('ledger.colEffective')}</th>
                  <th className="py-2 text-right font-semibold">{t('ledger.colAmount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap py-2 pr-3 text-ink-muted">{dateTime(e.createdAt)}</td>
                    <td className="py-2 pr-3 text-ink">{t(`ledgerType.${e.type}`)}</td>
                    <td className="max-w-[240px] truncate py-2 pr-3 text-ink-muted" title={ledgerNote(e.note)}>{ledgerNote(e.note)}</td>
                    <td className="whitespace-nowrap py-2 pr-3 text-xs text-ink-muted">
                      {e.matured ? t('ledger.matured') : t('ledger.heldUntil', { date: dateOnly(e.availableAt) })}
                    </td>
                    <td className={`whitespace-nowrap py-2 text-right font-semibold ${e.amount < 0 ? 'text-danger' : 'text-success-ink'}`}>
                      {e.amount > 0 ? '+' : ''}
                      {money(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={totalPages} total={data?.total ?? 0} onPage={setPage} />
        </>
      )}
    </section>
  );
}
