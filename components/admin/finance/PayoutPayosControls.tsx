'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { payosPayoutApi, type PayosStatus } from '@/lib/api/payosPayout';
import { getAccessToken } from '@/lib/auth/token';
import { money } from '@/lib/finance';
import { BLOCKED_REFRESH_MS, clockTime, isRetryBlocked } from '@/lib/payosRetry';

interface Props {
  payoutId: number;
  amount: number;
  status: PayosStatus;
  /** Báo cho trang biết lệnh PayOS của yêu cầu này đang chạy (để khóa các nút chuyển tay/từ chối/thất bại). */
  onInFlightChange: (payoutId: number, inFlight: boolean) => void;
  /** Gọi khi lệnh thành công để tải lại danh sách (yêu cầu thành "Đã chuyển"). */
  onChanged: () => void;
  disabled?: boolean;
}

/**
 * Nút "Chi qua PayOS" cho 1 yêu cầu rút đã duyệt + trạng thái lệnh chi: đang xử lý thì nút bị khóa và hiện rõ "đang xử lý", tự làm mới 10 giây/lần,
 * tự tải lại khi thành công. Khóa cả chuyển tay/từ chối/thất bại trong lúc lệnh còn chạy để không chi hai lần hoặc trả tiền về số dư khi PayOS vẫn đang chuyển.
 */
export function PayoutPayosControls({ payoutId, amount, status, onInFlightChange, onChanged, disabled }: Props) {
  const t = useTranslations('admin.payouts.payos');
  const { data: orders, refetch } = useQuery({
    queryKey: ['admin', 'payos-payout', 'orders', 'INSTRUCTOR_PAYOUT', payoutId],
    queryFn: () => payosPayoutApi.orders('INSTRUCTOR_PAYOUT', payoutId),
    enabled: !!getAccessToken(),
    retry: false,
    refetchInterval: (q) => {
      const o = q.state.data?.[0];
      if (o && (o.status === 'PENDING' || o.status === 'SUBMITTED' || o.status === 'UNKNOWN')) return 10_000;
      // Đang bị chặn chi lại theo thời gian: làm mới định kỳ để nút tự mở đúng lúc BE cho phép.
      return isRetryBlocked(o) ? BLOCKED_REFRESH_MS : false;
    },
  });
  const latest = orders?.[0];
  const retryBlocked = isRetryBlocked(latest);
  const inFlight = !!latest && (latest.status === 'PENDING' || latest.status === 'SUBMITTED' || latest.status === 'UNKNOWN');
  const retryAt = retryBlocked ? clockTime(latest?.nextRetryAt) : null;
  const blockedLabel = retryBlocked ? (retryAt ? t('retryAt', { time: retryAt }) : t('locked')) : null;

  const transfer = useMutation({
    mutationFn: () => payosPayoutApi.transferPayout(payoutId),
    onSuccess: (o) => {
      toast.success(
        o.status === 'SUCCEEDED'
          ? t('succeeded')
          : o.status === 'FAILED'
            ? t('rejected', { reason: o.errorMessage ?? t('unknownReason') })
            : t('sent'),
      );
      void refetch();
      onChanged();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : t('sendError')),
  });

  useEffect(() => {
    onInFlightChange(payoutId, inFlight);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ báo khi trạng thái chạy đổi
  }, [inFlight]);

  const was = useRef(false);
  useEffect(() => {
    if (was.current && latest?.status === 'SUCCEEDED') onChanged();
    was.current = inFlight;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ phản ứng khi trạng thái lệnh đổi
  }, [latest?.status]);

  // Nút nằm cùng hàng với các nút khác (kích thước cố định, không giãn); dòng trạng thái xuống hàng riêng (basis-full) để không đẩy/chèn các nút kia.
  return (
    <>
      <button
        type="button"
        disabled={disabled || transfer.isPending || inFlight || retryBlocked}
        title={retryBlocked ? (latest?.retryBlockedReason ?? t('blocked')) : t('hint', { amount: money(amount), balance: status.balance === null ? t('unknownBalance') : money(status.balance) })}
        onClick={() => transfer.mutate()}
        className="whitespace-nowrap rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
      >
        {transfer.isPending ? t('sending') : inFlight ? t('processing') : blockedLabel ?? (latest?.status === 'FAILED' || latest?.status === 'UNKNOWN' ? t('retry') : t('send'))}
      </button>
      {latest && (
        <span className={`basis-full text-right text-[11px] ${latest.status === 'FAILED' ? 'text-danger' : 'text-ink-muted'}`}>
          {latest.referenceId}:{' '}
          {latest.status === 'SUCCEEDED'
            ? t('ok')
            : latest.status === 'FAILED'
              ? `${t('fail')}${latest.failureCategory ? ` (${t(`cause.${latest.failureCategory}`)})` : ''}${latest.errorMessage ? ` — ${latest.errorMessage}` : ''}${retryBlocked && latest.retryBlockedReason ? `. ${latest.retryBlockedReason}` : ''}`
              : latest.status === 'UNKNOWN'
                ? t('unknown')
                : t('pending')}
          {latest.nameMismatch ? t('nameMismatch') : ''}
        </span>
      )}
    </>
  );
}
