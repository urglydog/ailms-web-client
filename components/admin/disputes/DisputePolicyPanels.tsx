'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { disputesApi } from '@/lib/api/disputes';
import { payosPayoutApi } from '@/lib/api/payosPayout';
import { getAccessToken } from '@/lib/auth/token';
import { REASON_CODES, REASON_LABEL } from '@/lib/refundPolicy';
import type { AppealDecision, DisputeAdminRes, RefundReasonCode, RefundResponsibility } from '@/types/domain';

export { REASON_CODES, REASON_LABEL } from '@/lib/refundPolicy';

const INPUT = 'w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent';

/** Điều kiện chính sách để bấm "Đánh dấu đã hoàn tiền" (BE kiểm lại, đây chỉ để chặn sớm và giải thích). */
export function policyProblem(
  d: DisputeAdminRes,
  responsibility: RefundResponsibility,
  reasonCode: RefundReasonCode | '',
  note: string,
  evidenceNote: string,
): string | null {
  if (responsibility !== 'STANDARD' && reasonCode === '') return 'Hãy chọn mã lý do cho chế độ này.';
  if (responsibility === 'INSTRUCTOR_FAULT') {
    if (note.trim().length < 10) return 'Chế độ "giảng viên chịu toàn bộ" cần ghi chú lý do rõ ràng (tối thiểu 10 ký tự).';
    if (evidenceNote.trim().length < 20) return 'Cần nêu minh chứng (tối thiểu 20 ký tự: bằng chứng nào, ở đâu).';
    const waiting = d.instructorDecision == null && d.instructorDeadlineAt != null && new Date(d.instructorDeadlineAt).getTime() > Date.now();
    if (waiting) return 'Giảng viên chưa phản hồi và chưa hết hạn phản hồi — hãy chờ rồi mới quyết định giảng viên chịu trách nhiệm.';
  }
  return null;
}

/** Chọn mã lý do (lọc theo chế độ) + ô minh chứng khi "giảng viên chịu toàn bộ". */
export function ReasonCodeFields({
  responsibility,
  reasonCode,
  onReasonCode,
  evidenceNote,
  onEvidenceNote,
  problem,
}: {
  responsibility: RefundResponsibility;
  reasonCode: RefundReasonCode | '';
  onReasonCode: (v: RefundReasonCode | '') => void;
  evidenceNote: string;
  onEvidenceNote: (v: string) => void;
  problem: string | null;
}) {
  const codes = REASON_CODES[responsibility];
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">Mã lý do {responsibility === 'STANDARD' ? '(không bắt buộc)' : '*'}</span>
        <select value={reasonCode} onChange={(e) => onReasonCode(e.target.value as RefundReasonCode | '')} className={INPUT}>
          <option value="">{responsibility === 'STANDARD' ? 'Không chọn' : 'Chọn mã lý do'}</option>
          {codes.map((c) => (
            <option key={c} value={c}>{REASON_LABEL[c]}</option>
          ))}
        </select>
      </label>
      {responsibility === 'INSTRUCTOR_FAULT' && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Minh chứng * (giảng viên sẽ thấy nội dung này)</span>
          <textarea
            value={evidenceNote}
            onChange={(e) => onEvidenceNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="VD: Bài 3 sao chép nguyên văn khóa X tại đường dẫn ..., ảnh so sánh đính kèm trong khiếu nại"
            className={INPUT}
          />
          <span className="text-xs text-ink-muted">
            Chỉ chọn chế độ này khi có vi phạm có bằng chứng và giảng viên đã được phản hồi hoặc đã hết hạn phản hồi. Giảng viên có quyền khiếu nại một lần.
          </span>
        </label>
      )}
      {problem && <p className="m-0 text-xs text-danger">{problem}</p>}
    </div>
  );
}

/** Tài khoản nhận hoàn tiền học viên khai báo + trạng thái xác nhận chính chủ. */
export function RefundAccountInfo({ d }: { d: DisputeAdminRes }) {
  if (!d.refundBankCode) {
    return (
      <p className="m-0 text-xs text-ink-muted">
        Học viên chưa khai tài khoản nhận hoàn tiền dạng chuẩn
        {d.refundBankAccount ? ` (ghi chú tự do: ${d.refundBankAccount})` : ''}; chỉ chuyển thủ công được.
      </p>
    );
  }
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink">
      <div>
        <span className="font-semibold">{d.refundBankCode}</span> · <span className="font-mono">{d.refundAccountNumber}</span>
      </div>
      <div className="text-xs text-ink-muted">
        Chủ tài khoản: {d.refundAccountHolder} · {d.refundAccountConfirmed ? 'học viên đã xác nhận chính chủ' : 'chưa xác nhận chính chủ'}
      </div>
    </div>
  );
}

/** Nút "Chi qua PayOS" cho khoản hoàn đang chờ chuyển + trạng thái lệnh chi gần nhất. Chỉ hiện khi công tắc chi tự động bật. */
export function PayosRefundTransfer({ d, onChanged }: { d: DisputeAdminRes; onChanged: () => void }) {
  const { data: status } = useQuery({
    queryKey: ['admin', 'payos-payout', 'status'],
    queryFn: () => payosPayoutApi.status(),
    enabled: !!getAccessToken(),
    retry: false,
  });
  const { data: orders, refetch } = useQuery({
    queryKey: ['admin', 'payos-payout', 'orders', 'DISPUTE_REFUND', d.id],
    queryFn: () => payosPayoutApi.orders('DISPUTE_REFUND', d.id),
    enabled: !!getAccessToken() && !!status?.enabled,
    retry: false,
  });
  const transfer = useMutation({
    mutationFn: () => payosPayoutApi.transferRefund(d.id),
    onSuccess: (o) => {
      toast.success(
        o.status === 'SUCCEEDED'
          ? 'PayOS đã chuyển tiền và đã ghi nhận.'
          : o.status === 'FAILED'
            ? `PayOS từ chối: ${o.errorMessage ?? 'không rõ lý do'}`
            : 'Đã gửi lệnh chi sang PayOS, hệ thống tự cập nhật khi có kết quả.',
      );
      void refetch();
      onChanged();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không gửi được lệnh chi.'),
  });

  if (!status?.enabled) return null;
  const latest = orders?.[0];
  const blocked = !d.refundBankCode || !d.refundAccountConfirmed;
  const inFlight = latest && (latest.status === 'PENDING' || latest.status === 'SUBMITTED');
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface-raised p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={transfer.isPending || blocked || !!inFlight}
          onClick={() => transfer.mutate()}
          title={blocked ? 'Cần học viên khai tài khoản dạng chuẩn và xác nhận chính chủ' : 'Chuyển tiền hoàn qua PayOS'}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          Chi qua PayOS
        </button>
        <span className="text-xs text-ink-muted">
          Số dư tài khoản chi: {status.balance == null ? 'không rõ' : `${status.balance.toLocaleString('vi-VN')}đ`}
        </span>
      </div>
      {blocked && <p className="m-0 text-xs text-ink-muted">Chưa đủ thông tin tài khoản chuẩn của học viên nên chưa chi tự động được; chuyển thủ công bên dưới.</p>}
      {latest && (
        <p className="m-0 text-xs text-ink">
          Lệnh {latest.referenceId}: {latest.status === 'SUCCEEDED' ? 'thành công' : latest.status === 'FAILED' ? 'thất bại' : latest.status === 'UNKNOWN' ? 'chưa rõ kết quả (có thể bấm gửi lại, không chi trùng)' : 'đang xử lý'}
          {latest.errorMessage ? ` — ${latest.errorMessage}` : ''}
          {latest.nameMismatch ? ` — ⚠ tên ngân hàng trả về "${latest.resolvedAccountName}" khác tên đã nhập` : ''}
        </p>
      )}
    </div>
  );
}

/** Khiếu nại của giảng viên với quyết định "giảng viên chịu toàn bộ": admin giữ nguyên hoặc giảm về chế độ Chuẩn. */
export function AppealPanel({ d, onChanged }: { d: DisputeAdminRes; onChanged: () => void }) {
  const [note, setNote] = useState('');
  const decide = useMutation({
    mutationFn: (decision: AppealDecision) => disputesApi.decideAppeal(d.id, { decision, note: note.trim() }),
    onSuccess: () => {
      toast.success('Đã quyết định khiếu nại của giảng viên.');
      setNote('');
      onChanged();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không xử lý được khiếu nại.'),
  });

  if (!d.appealStatus || d.appealStatus === 'NONE') return null;
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-lg border border-warning bg-surface p-4">
      <h3 className="m-0 text-sm font-semibold text-ink">Khiếu nại của giảng viên</h3>
      {d.appealReason && <p className="m-0 whitespace-pre-wrap text-sm text-ink">{d.appealReason}</p>}
      {d.appealStatus === 'OPEN' ? (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-muted">Lý do quyết định * (giảng viên sẽ nhận được nội dung này)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} className={INPUT} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={decide.isPending || !note.trim()}
              onClick={() => decide.mutate('REDUCE_TO_STANDARD')}
              title="Giảng viên chỉ phải trả phần đã nhận; hoàn lại phần phạt vượt mức"
              className="rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Chấp nhận, giảm về chế độ Chuẩn
            </button>
            <button
              type="button"
              disabled={decide.isPending || !note.trim()}
              onClick={() => decide.mutate('UPHOLD')}
              className="rounded-lg bg-surface-raised px-4 py-2 text-sm font-semibold text-danger ring-1 ring-inset ring-danger/40 hover:bg-danger/5 disabled:opacity-50"
            >
              Giữ nguyên quyết định
            </button>
          </div>
        </>
      ) : (
        <p className="m-0 text-xs text-ink-muted">
          Kết quả: {d.appealStatus === 'REDUCED' ? 'đã giảm về chế độ Chuẩn' : 'giữ nguyên quyết định'}
          {d.appealDecisionNote ? ` — ${d.appealDecisionNote}` : ''}
        </p>
      )}
    </div>
  );
}
