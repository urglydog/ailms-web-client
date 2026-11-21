'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { usePayoutAccounts, useRequestPayout } from '@/hooks/useFinance';
import { ApiError } from '@/lib/api/client';
import { dateOnly, money, newIdempotencyKey } from '@/lib/finance';
import type { FinanceSummary } from '@/types/finance';

/** Yêu cầu rút tiền: sau khi gửi phải bấm liên kết xác nhận trong email; admin chuyển khoản theo đợt cố định. */
export function RequestPayoutCard({ summary }: { summary: FinanceSummary }) {
  const request = useRequestPayout();
  const [amountText, setAmountText] = useState('');
  // Một khóa cho mỗi "lần định rút": bấm đúp/gửi lại do mạng chậm trả về đúng yêu cầu cũ, không tạo thêm.
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  const amount = Number(amountText.replace(/[^\d]/g, ''));
  const { data: accounts } = usePayoutAccounts();
  const activeAccounts = (accounts ?? []).filter((a) => a.status === 'ACTIVE' && (!a.usableFrom || new Date(a.usableFrom) <= new Date()));
  const primaryId = activeAccounts.find((a) => a.primary)?.id ?? activeAccounts[0]?.id;
  // Mặc định rút về tài khoản mặc định; chọn khác thì chỉ áp dụng cho lần rút này.
  const [pickedId, setPickedId] = useState<number | null>(null);
  const accountId = pickedId !== null && activeAccounts.some((a) => a.id === pickedId) ? pickedId : primaryId;
  const accountReady = activeAccounts.length > 0;

  let blocker: string | null = null;
  if (!summary.cryptoConfigured) blocker = 'Tính năng rút tiền chưa được bật trên máy chủ.';
  else if (!accountReady) blocker = 'Hãy liên kết và xác nhận tài khoản nhận tiền trước khi rút.';
  else if (summary.hasOpenPayout) blocker = 'Bạn đang có một yêu cầu rút tiền chưa hoàn tất.';
  else if (summary.withdrawable < summary.minPayoutAmount) blocker = `Cần tối thiểu ${money(summary.minPayoutAmount)} để rút.`;

  const valid = blocker === null && amount >= summary.minPayoutAmount && amount <= summary.withdrawable;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    request.mutate(
      { amount, idempotencyKey, accountId },
      {
        onSuccess: () => {
          toast.success('Đã tạo yêu cầu. Hãy mở email và bấm liên kết xác nhận trong vòng 30 phút.');
          setAmountText('');
          setIdempotencyKey(newIdempotencyKey());
        },
        onError: (err) => {
          setIdempotencyKey(newIdempotencyKey());
          toast.error(err instanceof ApiError ? err.message : 'Không tạo được yêu cầu rút tiền.');
        },
      },
    );
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
      <h2 className="m-0 font-display text-base font-bold text-ink">Yêu cầu rút tiền</h2>
      <p className="m-0 text-xs text-ink-muted">
        Tối thiểu {money(summary.minPayoutAmount)}. Sau khi xác nhận qua email, yêu cầu được xếp vào đợt chi gần nhất (kế tiếp:{' '}
        {dateOnly(summary.nextPayoutDate)}). Bạn sẽ nhận đủ số tiền đã yêu cầu rút. Phí chuyển tiền được LinguaLearn chi trả.
      </p>
      {blocker && <div className="rounded-lg bg-surface px-3 py-2 text-sm text-ink">{blocker}</div>}
      <form onSubmit={submit} className="flex flex-col gap-3">
        {activeAccounts.length > 1 && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Nhận về tài khoản</span>
            <select
              value={accountId ?? ''}
              onChange={(e) => setPickedId(Number(e.target.value))}
              disabled={blocker !== null}
              className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent disabled:opacity-50"
            >
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bankName} {a.accountMask}{a.primary ? ' (mặc định)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Số tiền muốn rút (VND)</span>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              disabled={blocker !== null}
              placeholder={String(summary.minPayoutAmount)}
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent disabled:opacity-50"
            />
            <button
              type="button"
              disabled={blocker !== null}
              onClick={() => setAmountText(String(Math.floor(summary.withdrawable)))}
              className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-accent-dark hover:bg-tint disabled:opacity-50"
            >
              Rút hết
            </button>
          </div>
        </label>
        {amountText !== '' && amount > summary.withdrawable && (
          <p className="m-0 text-xs text-danger">Vượt quá số có thể rút ({money(summary.withdrawable)}).</p>
        )}
        <button
          type="submit"
          disabled={!valid || request.isPending}
          className="w-fit rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {request.isPending ? 'Đang gửi...' : 'Gửi yêu cầu rút'}
        </button>
      </form>
    </section>
  );
}
