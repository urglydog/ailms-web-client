'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useCancelPayout, useChangePayoutAccount, useMyPayouts, usePayoutAccounts } from '@/hooks/useFinance';
import { ApiError } from '@/lib/api/client';
import { PAYOUT_STATUS_CLASS, PAYOUT_STATUS_LABEL, dateOnly, dateTime, money } from '@/lib/finance';

/** Lịch sử yêu cầu rút tiền; còn hủy được khi chưa được admin duyệt. */
export function PayoutHistory() {
  const { data, isLoading } = useMyPayouts();
  const cancel = useCancelPayout();
  const change = useChangePayoutAccount();
  const { data: accounts } = usePayoutAccounts();
  const active = (accounts ?? []).filter((a) => a.status === 'ACTIVE');
  // Yêu cầu đang đổi tài khoản (mở khung chọn ngay trong dòng, không popup) và lựa chọn tạm.
  const [changingId, setChangingId] = useState<number | null>(null);
  const [pickedAccountId, setPickedAccountId] = useState<number | null>(null);

  const handleCancel = (id: number) => {
    cancel.mutate(id, {
      onSuccess: () => toast.success('Đã hủy yêu cầu, số tiền được trả lại vào số dư.'),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không hủy được yêu cầu.'),
    });
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
      <h2 className="m-0 font-display text-base font-bold text-ink">Lịch sử rút tiền</h2>
      {isLoading ? (
        <p className="m-0 text-sm text-ink-muted">Đang tải...</p>
      ) : !data || data.length === 0 ? (
        <p className="m-0 text-sm text-ink-muted">Bạn chưa có yêu cầu rút tiền nào.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
          {data.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-mono text-xs text-ink-muted">{p.code}</span>
                <span className="font-semibold text-ink">{money(p.amount)}</span>
                <span className="text-xs text-ink-muted">
                  {p.bankName} {p.accountMask} · {dateTime(p.createdAt)}
                  {p.scheduledFor && p.status === 'REQUESTED' ? ` · dự kiến chi ${dateOnly(p.scheduledFor)}` : ''}
                  {p.transferRef ? ` · mã chuyển khoản ${p.transferRef}` : ''}
                </span>
                {p.rejectReason && <span className="text-xs text-danger">Lý do: {p.rejectReason}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${PAYOUT_STATUS_CLASS[p.status]}`}>
                  {PAYOUT_STATUS_LABEL[p.status]}
                </span>
                {(p.status === 'PENDING_EMAIL' || p.status === 'REQUESTED') && active.length > 1 && changingId !== p.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setChangingId(p.id);
                      setPickedAccountId(null);
                    }}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-accent-dark hover:bg-tint"
                  >
                    Đổi tài khoản nhận
                  </button>
                )}
                {(p.status === 'PENDING_EMAIL' || p.status === 'REQUESTED') && (
                  <button
                    type="button"
                    disabled={cancel.isPending}
                    onClick={() => handleCancel(p.id)}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-50"
                  >
                    Hủy
                  </button>
                )}
              </div>
              {changingId === p.id && (
                <div className="flex w-full flex-wrap items-center gap-2 rounded-lg bg-surface p-3">
                  <select
                    value={pickedAccountId ?? ''}
                    onChange={(e) => setPickedAccountId(e.target.value === '' ? null : Number(e.target.value))}
                    aria-label="Tài khoản nhận mới"
                    className="min-w-0 flex-1 rounded-lg border border-line bg-surface-raised p-2 text-sm text-ink outline-none focus:border-accent"
                  >
                    <option value="">Chọn tài khoản nhận mới</option>
                    {active.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.bankName} {a.accountMask}{a.primary ? ' (mặc định)' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={pickedAccountId === null || change.isPending}
                    onClick={() =>
                      pickedAccountId !== null &&
                      change.mutate(
                        { payoutId: p.id, accountId: pickedAccountId },
                        {
                          onSuccess: () => {
                            toast.success('Đã đổi tài khoản nhận của yêu cầu.');
                            setChangingId(null);
                          },
                          onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không đổi được tài khoản nhận.'),
                        },
                      )
                    }
                    className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
                  >
                    Áp dụng
                  </button>
                  <button type="button" onClick={() => setChangingId(null)} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-muted hover:text-ink">
                    Hủy
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
