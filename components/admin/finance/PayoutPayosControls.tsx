'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { payosPayoutApi, type PayosStatus } from '@/lib/api/payosPayout';
import { getAccessToken } from '@/lib/auth/token';
import { money } from '@/lib/finance';

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
  const { data: orders, refetch } = useQuery({
    queryKey: ['admin', 'payos-payout', 'orders', 'INSTRUCTOR_PAYOUT', payoutId],
    queryFn: () => payosPayoutApi.orders('INSTRUCTOR_PAYOUT', payoutId),
    enabled: !!getAccessToken(),
    retry: false,
    refetchInterval: (q) => {
      const o = q.state.data?.[0];
      return o && (o.status === 'PENDING' || o.status === 'SUBMITTED' || o.status === 'UNKNOWN') ? 10_000 : false;
    },
  });
  const latest = orders?.[0];
  const inFlight = !!latest && (latest.status === 'PENDING' || latest.status === 'SUBMITTED' || latest.status === 'UNKNOWN');

  const transfer = useMutation({
    mutationFn: () => payosPayoutApi.transferPayout(payoutId),
    onSuccess: (o) => {
      toast.success(
        o.status === 'SUCCEEDED'
          ? 'PayOS đã chi và đã ghi nhận.'
          : o.status === 'FAILED'
            ? `PayOS từ chối: ${o.errorMessage ?? 'không rõ lý do'}`
            : 'Đã gửi lệnh chi sang PayOS, hệ thống sẽ tự cập nhật khi có kết quả.',
      );
      void refetch();
      onChanged();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không gửi được lệnh chi.'),
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
        disabled={disabled || transfer.isPending || inFlight}
        title={`Gửi lệnh chuyển ${money(amount)} qua PayOS. Số dư tài khoản chi: ${status.balance === null ? 'không rõ' : money(status.balance)}`}
        onClick={() => transfer.mutate()}
        className="whitespace-nowrap rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
      >
        {transfer.isPending ? 'Đang gửi...' : inFlight ? 'PayOS đang xử lý...' : latest?.status === 'FAILED' || latest?.status === 'UNKNOWN' ? 'Chi lại qua PayOS' : 'Chi qua PayOS'}
      </button>
      {latest && (
        <span className={`basis-full text-right text-[11px] ${latest.status === 'FAILED' ? 'text-danger' : 'text-ink-muted'}`}>
          {latest.referenceId}:{' '}
          {latest.status === 'SUCCEEDED'
            ? 'thành công'
            : latest.status === 'FAILED'
              ? `thất bại${latest.errorMessage ? ` — ${latest.errorMessage}` : ''}`
              : latest.status === 'UNKNOWN'
                ? 'chưa rõ kết quả'
                : 'đang xử lý, có thể mất vài phút'}
          {latest.nameMismatch ? ' ⚠ tên ngân hàng khác tên đã nhập' : ''}
        </span>
      )}
    </>
  );
}
