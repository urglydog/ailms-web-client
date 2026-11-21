'use client';

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
  return (
    <div className="flex flex-col gap-3">
      {!summary.cryptoConfigured && (
        <div role="alert" className="rounded-xl border border-warning bg-surface-raised p-4 text-sm text-ink">
          Máy chủ chưa bật tính năng tài khoản nhận tiền nên chưa thể liên kết tài khoản hay rút tiền. Thu nhập của bạn vẫn
          được ghi nhận đầy đủ; quản trị viên sẽ bật tính năng này.
        </div>
      )}
      {summary.available < 0 && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-4 text-sm text-ink">
          Số dư của bạn đang âm {money(Math.abs(summary.available))} do các khoản hoàn tiền phát sinh sau khi đã chi trả. Khoản
          này sẽ được bù trừ vào thu nhập các đơn hàng sau.
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Có thể rút" value={money(summary.withdrawable)} hint={`Đợt chi kế tiếp: ${dateOnly(summary.nextPayoutDate)}`} strong />
        <Card label="Đang giữ" value={money(summary.pending)} hint="Thu nhập mới, giữ trong thời gian hoàn tiền" />
        <Card label="Đóng băng" value={money(summary.frozen)} hint="Đơn đang có khiếu nại, chờ xử lý" />
        <Card label="Đã nhận" value={money(summary.paidOut)} hint="Tổng số đã được chuyển khoản" />
      </div>
    </div>
  );
}
