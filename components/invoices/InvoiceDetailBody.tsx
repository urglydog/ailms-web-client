'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dateTime, money } from '@/lib/finance';
import { INVOICE_DETAIL_FIELDS, INVOICE_STATUS_LABEL, INVOICE_TYPE_CLASS, INVOICE_TYPE_LABEL, PAYOUT_FEE_NOTE } from '@/lib/invoices';
import { useThemeColors } from '@/lib/theme/useThemeColors';
import type { InvoiceDetail } from '@/types/invoice';

/** Nội dung chi tiết một chứng từ, dùng chung cho admin (hộp chi tiết) và giảng viên (xem bảng kê tháng). */
export function InvoiceDetailBody({ detail }: { detail: InvoiceDetail }) {
  const palette = useThemeColors();
  const h = detail.header;
  const fields = INVOICE_DETAIL_FIELDS.filter((f) => detail.details[f.key] !== undefined && detail.details[f.key] !== '');
  const slices = detail.breakdown.slice(0, 8).map((b) => ({ ...b, short: b.label.length > 26 ? `${b.label.slice(0, 25)}…` : b.label }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-semibold text-ink">{h.number}</span>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${INVOICE_TYPE_CLASS[h.type]}`}>{INVOICE_TYPE_LABEL[h.type]}</span>
        {h.status === 'VOIDED' && <span className="rounded-full border border-danger/40 px-2.5 py-1 text-xs font-semibold text-danger">{INVOICE_STATUS_LABEL.VOIDED}</span>}
      </div>
      <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-xs font-semibold text-ink-muted">Người nhận</dt>
          <dd className="m-0 text-ink">{h.partyName}<div className="text-xs text-ink-muted">{h.partyEmail}</div></dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-ink-muted">Ngày phát hành</dt>
          <dd className="m-0 text-ink">{dateTime(h.issuedAt)}</dd>
        </div>
        {h.relatedNumber && (
          <div>
            <dt className="text-xs font-semibold text-ink-muted">Chứng từ liên quan</dt>
            <dd className="m-0 font-mono text-ink">{h.relatedNumber}</dd>
          </div>
        )}
        {fields.map((f) => (
          <div key={f.key}>
            <dt className="text-xs font-semibold text-ink-muted">{f.label}</dt>
            <dd className="m-0 text-ink">{f.money ? money(Number(detail.details[f.key])) : String(detail.details[f.key])}</dd>
          </div>
        ))}
      </dl>
      {h.type === 'PAYOUT' && <p className="m-0 text-xs text-ink-muted">{PAYOUT_FEE_NOTE}</p>}

      {slices.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="m-0 text-sm font-bold text-ink">Thu nhập theo khóa học</h3>
          <div role="img" aria-label="Biểu đồ cột thu nhập theo khóa học trong kỳ" className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slices} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={palette.lineSoft} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: palette.inkMuted }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="short" width={150} tick={{ fontSize: 11, fill: palette.inkMuted }} />
                <Tooltip formatter={(v) => money(Number(v))} labelFormatter={(_, p) => String(p?.[0]?.payload?.label ?? '')} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {slices.map((s) => (
                    <Cell key={s.label} fill={palette.accent} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs text-ink-muted">
            <tr>
              <th className="px-3 py-2 font-semibold">Nội dung</th>
              <th className="px-3 py-2 text-right font-semibold">Số tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {detail.lines.map((l) => (
              <tr key={l.lineNo}>
                <td className="px-3 py-2 text-ink">{l.description}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-ink">{money(l.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-line bg-surface">
            {detail.discount > 0 && (
              <tr>
                <td className="px-3 py-2 text-ink-muted">Khuyến mãi</td>
                <td className="px-3 py-2 text-right text-ink-muted">-{money(detail.discount)}</td>
              </tr>
            )}
            <tr>
              <td className="px-3 py-2 font-bold text-ink">Tổng</td>
              <td className="px-3 py-2 text-right font-bold text-ink">{money(h.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
