'use client';

import { useLedger } from '@/hooks/useFinance';
import { LEDGER_TYPE_LABEL, dateOnly, dateTime, money } from '@/lib/finance';

/** Sao kê sổ cái: từng khoản cộng/trừ vào thu nhập (30 dòng mới nhất). */
export function LedgerTable() {
  const { data, isLoading } = useLedger();
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
      <h2 className="m-0 font-display text-base font-bold text-ink">Sao kê thu nhập</h2>
      {isLoading ? (
        <p className="m-0 text-sm text-ink-muted">Đang tải...</p>
      ) : !data || data.length === 0 ? (
        <p className="m-0 text-sm text-ink-muted">Chưa có khoản thu nhập nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line text-xs text-ink-muted">
              <tr>
                <th className="py-2 pr-3 font-semibold">Thời gian</th>
                <th className="py-2 pr-3 font-semibold">Loại</th>
                <th className="py-2 pr-3 font-semibold">Ghi chú</th>
                <th className="py-2 pr-3 font-semibold">Hiệu lực</th>
                <th className="py-2 text-right font-semibold">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {data.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap py-2 pr-3 text-ink-muted">{dateTime(e.createdAt)}</td>
                  <td className="py-2 pr-3 text-ink">{LEDGER_TYPE_LABEL[e.type]}</td>
                  <td className="max-w-[240px] truncate py-2 pr-3 text-ink-muted" title={e.note ?? ''}>{e.note ?? ''}</td>
                  <td className="whitespace-nowrap py-2 pr-3 text-xs text-ink-muted">
                    {e.matured ? 'Đã tính vào số dư' : `Giữ đến ${dateOnly(e.availableAt)}`}
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
      )}
    </section>
  );
}
