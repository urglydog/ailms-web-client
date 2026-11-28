'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { debtApi, type DebtRepayment } from '@/lib/api/debt';
import { getAccessToken } from '@/lib/auth/token';
import { dateTime, money } from '@/lib/finance';


/**
 * Công nợ (14/11/2026): hiện khi số dư khả dụng ÂM do hoàn tiền muộn/phạt. Giảng viên trả một phần hoặc hết qua QR PayOS, hệ thống trừ đúng số đã
 * trả. Không hiện gì khi không nợ và không có mã trả nợ đang chờ.
 */
export function DebtCard() {
  const t = useTranslations('instructor.debt');
  const queryClient = useQueryClient();
  const { data: debt } = useQuery({
    queryKey: ['instructor', 'finance', 'debt'],
    queryFn: () => debtApi.status(),
    enabled: !!getAccessToken(),
    refetchInterval: 60_000,
  });
  const [amountText, setAmountText] = useState('');
  const [active, setActive] = useState<DebtRepayment | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['instructor', 'finance'] });

  const repay = useMutation({
    mutationFn: (amount: number) => debtApi.repay(amount),
    onSuccess: (p) => {
      setActive(p);
      setAmountText('');
      refresh();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : t('repayError')),
  });

  // Hỏi trạng thái mã đang hiển thị mỗi 5 giây cho tới khi thanh toán xong/hết hạn.
  useEffect(() => {
    if (!active || active.status !== 'PENDING') return;
    const timer = window.setInterval(() => {
      debtApi
        .repayment(active.id)
        .then((p) => {
          if (p.status !== 'PENDING') {
            setActive(p);
            if (p.status === 'PAID') toast.success(t('paidToast'));
            refresh();
          }
        })
        .catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh ổn định theo queryClient
  }, [active]);

  if (!debt) return null;
  const pending = active && active.status === 'PENDING' ? active : debt.pendingRepayments[0];
  if (debt.debtAmount <= 0 && !pending && active?.status !== 'PAID') return null;

  const amount = Number(amountText.replace(/[^\d]/g, ''));
  const valid = amount > 0 && amount <= debt.debtAmount && (amount >= debt.minRepay || amount === debt.debtAmount);
  const daysLeft = Math.max(0, debt.restrictAfterDays - debt.daysInDebt);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-danger/40 bg-danger/5 p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 font-display text-base font-bold text-ink">{t('title')}</h2>
        {debt.debtAmount > 0 && <span className="font-display text-xl font-bold text-danger">{money(debt.debtAmount)}</span>}
      </div>

      {debt.debtAmount > 0 ? (
        <>
          <p className="m-0 text-sm text-ink">{t(`level.${debt.level >= 1 && debt.level <= 3 ? debt.level : 1}`)}</p>
          <p className="m-0 text-xs text-ink-muted">
            {debt.debtSince ? t('since', { date: dateTime(debt.debtSince), days: debt.daysInDebt }) : ''}
            {debt.level < 2
              ? t('daysLeft', { days: daysLeft })
              : debt.level === 2
                ? t('suspendAfter', { days: debt.suspendAfterDays })
                : ''}
            {debt.paused ? t('paused') : ''}
          </p>
          {debt.recentCharges.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-1 p-0 text-xs text-ink">
              {debt.recentCharges.map((c, i) => (
                <li key={`${c.createdAt}-${i}`}>
                  {dateTime(c.createdAt)} · {c.note ?? t('refundFallback')} · <span className="font-semibold text-danger">-{money(c.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="m-0 text-sm text-ink">{active?.status === 'PAID' ? t('cleared') : t('none')}</p>
      )}

      {debt.debtAmount > 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) repay.mutate(amount);
          }}
          className="flex flex-col gap-2"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">{t('amountLabel', { min: money(debt.minRepay) })}</span>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                placeholder={String(debt.debtAmount)}
                className="min-w-0 flex-1 rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setAmountText(String(debt.debtAmount))}
                className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-accent-dark hover:bg-tint"
              >
                {t('payAll')}
              </button>
            </div>
          </label>
          {amountText !== '' && amount > debt.debtAmount && <p className="m-0 text-xs text-danger">{t('exceeds', { amount: money(debt.debtAmount) })}</p>}
          <button
            type="submit"
            disabled={!valid || repay.isPending}
            className="w-fit rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {repay.isPending ? t('creating') : t('createQr')}
          </button>
        </form>
      )}

      {pending && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-line bg-surface-raised p-4 text-center">
          <p className="m-0 text-sm font-semibold text-ink">{t('scan', { amount: money(pending.amount) })}</p>
          {pending.qrCode ? (
            <div
              // eslint-disable-next-line no-restricted-syntax -- nền QR phải trắng để quét được
              className="rounded-lg bg-white p-3"
            >
              <QRCodeSVG value={pending.qrCode} size={176} />
            </div>
          ) : null}
          {pending.checkoutUrl && (
            <a href={pending.checkoutUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-accent-dark hover:underline">
              {t('openPayos')}
            </a>
          )}
          <p className="m-0 text-xs text-ink-muted">{t('autoUpdate')}</p>
        </div>
      )}
    </section>
  );
}
