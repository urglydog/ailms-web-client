'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { debtApi, type DebtRepayment } from '@/lib/api/debt';
import { getAccessToken } from '@/lib/auth/token';
import { dateTime, money } from '@/lib/finance';

const LEVEL_TEXT: Record<number, string> = {
  1: 'Đang nợ. Doanh thu mới sẽ tự bù trừ khi hết thời gian giữ; bạn cũng có thể trả chủ động bên dưới.',
  2: 'Nợ quá hạn: bạn tạm thời không xuất bản được khóa mới và không đăng ký quảng bá được.',
  3: 'Nợ quá hạn dài: các khóa của bạn tạm ngừng nhận đăng ký mới (học viên đã mua vẫn học bình thường).',
};

/**
 * Công nợ (14/11/2026): hiện khi số dư khả dụng ÂM do hoàn tiền muộn/phạt. Giảng viên trả một phần hoặc hết qua QR PayOS, hệ thống trừ đúng số đã
 * trả. Không hiện gì khi không nợ và không có mã trả nợ đang chờ.
 */
export function DebtCard() {
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
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không tạo được mã trả nợ.'),
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
            if (p.status === 'PAID') toast.success('Đã nhận thanh toán trả nợ.');
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
        <h2 className="m-0 font-display text-base font-bold text-ink">Công nợ</h2>
        {debt.debtAmount > 0 && <span className="font-display text-xl font-bold text-danger">{money(debt.debtAmount)}</span>}
      </div>

      {debt.debtAmount > 0 ? (
        <>
          <p className="m-0 text-sm text-ink">{LEVEL_TEXT[debt.level] ?? LEVEL_TEXT[1]}</p>
          <p className="m-0 text-xs text-ink-muted">
            {debt.debtSince ? `Nợ từ ${dateTime(debt.debtSince)} (${debt.daysInDebt} ngày). ` : ''}
            {debt.level < 2
              ? `Còn ${daysLeft} ngày trước khi bị hạn chế xuất bản khóa mới và đăng ký quảng bá.`
              : debt.level === 2
                ? `Sau ${debt.suspendAfterDays} ngày nợ, các khóa sẽ tạm ngừng nhận đăng ký mới.`
                : ''}
            {debt.paused ? ' Các hạn chế đang tạm dừng vì bạn có khiếu nại hoàn tiền chờ xử lý.' : ''}
          </p>
          {debt.recentCharges.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-1 p-0 text-xs text-ink">
              {debt.recentCharges.map((c, i) => (
                <li key={`${c.createdAt}-${i}`}>
                  {dateTime(c.createdAt)} · {c.note ?? 'Hoàn tiền'} · <span className="font-semibold text-danger">-{money(c.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="m-0 text-sm text-ink">{active?.status === 'PAID' ? 'Bạn đã hết công nợ. Cảm ơn bạn!' : 'Bạn không còn công nợ.'}</p>
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
            <span className="text-sm font-semibold text-ink">Số tiền muốn trả (có thể trả một phần, tối thiểu {money(debt.minRepay)})</span>
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
                Trả hết
              </button>
            </div>
          </label>
          {amountText !== '' && amount > debt.debtAmount && <p className="m-0 text-xs text-danger">Vượt quá công nợ ({money(debt.debtAmount)}).</p>}
          <button
            type="submit"
            disabled={!valid || repay.isPending}
            className="w-fit rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {repay.isPending ? 'Đang tạo mã...' : 'Tạo mã QR trả nợ'}
          </button>
        </form>
      )}

      {pending && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-line bg-surface-raised p-4 text-center">
          <p className="m-0 text-sm font-semibold text-ink">Quét mã để trả {money(pending.amount)}</p>
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
              Mở trang thanh toán PayOS
            </a>
          )}
          <p className="m-0 text-xs text-ink-muted">Hệ thống tự cập nhật ngay khi nhận được tiền. Mã có hạn, hết hạn thì tạo lại.</p>
        </div>
      )}
    </section>
  );
}
