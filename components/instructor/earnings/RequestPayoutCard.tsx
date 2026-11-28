'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { usePayoutAccounts, useRequestPayout } from '@/hooks/useFinance';
import { ApiError } from '@/lib/api/client';
import { dateOnly, money, newIdempotencyKey } from '@/lib/finance';
import type { FinanceSummary } from '@/types/finance';

/** Yêu cầu rút tiền: sau khi gửi phải bấm liên kết xác nhận trong email; admin chuyển khoản theo đợt cố định. */
export function RequestPayoutCard({ summary }: { summary: FinanceSummary }) {
  const t = useTranslations('instructor.requestPayout');
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
  if (!summary.cryptoConfigured) blocker = t('blocker.notConfigured');
  else if (!accountReady) blocker = t('blocker.noAccount');
  else if (summary.hasOpenPayout) blocker = t('blocker.open');
  else if (summary.withdrawable < summary.minPayoutAmount) blocker = t('blocker.min', { amount: money(summary.minPayoutAmount) });

  const valid = blocker === null && amount >= summary.minPayoutAmount && amount <= summary.withdrawable;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    request.mutate(
      { amount, idempotencyKey, accountId },
      {
        onSuccess: () => {
          toast.success(t('created'));
          setAmountText('');
          setIdempotencyKey(newIdempotencyKey());
        },
        onError: (err) => {
          setIdempotencyKey(newIdempotencyKey());
          toast.error(err instanceof ApiError ? err.message : t('createFailed'));
        },
      },
    );
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
      <h2 className="m-0 font-display text-base font-bold text-ink">{t('title')}</h2>
      <p className="m-0 text-xs text-ink-muted">
        {t('intro', { min: money(summary.minPayoutAmount), date: dateOnly(summary.nextPayoutDate) })}
      </p>
      {blocker && <div className="rounded-lg bg-surface px-3 py-2 text-sm text-ink">{blocker}</div>}
      <form onSubmit={submit} className="flex flex-col gap-3">
        {activeAccounts.length > 1 && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">{t('toAccount')}</span>
            <select
              value={accountId ?? ''}
              onChange={(e) => setPickedId(Number(e.target.value))}
              disabled={blocker !== null}
              className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent disabled:opacity-50"
            >
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bankName} {a.accountMask}{a.primary ? t('defaultSuffix') : ''}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">{t('amountLabel')}</span>
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
              {t('all')}
            </button>
          </div>
        </label>
        {amountText !== '' && amount > summary.withdrawable && (
          <p className="m-0 text-xs text-danger">{t('exceeds', { amount: money(summary.withdrawable) })}</p>
        )}
        <button
          type="submit"
          disabled={!valid || request.isPending}
          className="w-fit rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {request.isPending ? t('sending') : t('submit')}
        </button>
      </form>
    </section>
  );
}
