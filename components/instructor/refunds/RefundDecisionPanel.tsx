'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAppealDispute } from '@/hooks/useInstructorDisputes';
import { ApiError } from '@/lib/api/client';
import { REASON_LABEL, RESPONSIBILITY_LABEL } from '@/lib/refundPolicy';
import type { InstructorDisputeRes } from '@/types/domain';

const money = (n: number | null | undefined) => `${(n ?? 0).toLocaleString('vi-VN')}đ`;
const dateTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

/**
 * Quyết định hoàn tiền dành cho giảng viên (14/11/2026): giảng viên phải biết MÌNH BỊ TRỪ BAO NHIÊU, VÌ SAO (mã lý do + ghi chú + minh chứng
 * của admin) và còn quyền khiếu nại một lần khi bị quy "giảng viên chịu toàn bộ". Khiếu nại làm ngay trong khung này, không mở thêm cửa sổ.
 */
export function RefundDecisionPanel({ d }: { d: InstructorDisputeRes }) {
  const appeal = useAppealDispute();
  const [reason, setReason] = useState('');
  if (!d.refundResponsibility) return null;

  const canAppeal = d.refundResponsibility === 'INSTRUCTOR_FAULT' && (d.appealStatus ?? 'NONE') === 'NONE' && !!d.appealDeadline;
  const submit = () =>
    appeal.mutate(
      { id: d.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success('Đã gửi khiếu nại. Quản trị viên sẽ xem xét và báo lại.');
          setReason('');
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không gửi được khiếu nại.'),
      },
    );

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 text-sm text-ink">
      <h3 className="m-0 text-sm font-semibold text-ink">Quyết định hoàn tiền</h3>
      <p className="m-0">
        Chế độ: <strong>{RESPONSIBILITY_LABEL[d.refundResponsibility]}</strong>. Thu nhập của bạn bị trừ:{' '}
        <strong>{money(d.instructorCharge)}</strong>.
      </p>
      {d.refundReasonCode && <p className="m-0">Lý do: {REASON_LABEL[d.refundReasonCode]}.</p>}
      {d.refundNote && <p className="m-0 whitespace-pre-wrap">Ghi chú của quản trị viên: {d.refundNote}</p>}
      {d.refundEvidenceNote && <p className="m-0 whitespace-pre-wrap">Minh chứng: {d.refundEvidenceNote}</p>}

      {d.appealStatus === 'OPEN' && <p className="m-0 font-semibold text-accent-dark">Khiếu nại của bạn đang chờ quản trị viên xử lý.</p>}
      {(d.appealStatus === 'UPHELD' || d.appealStatus === 'REDUCED') && (
        <p className="m-0">
          Kết quả khiếu nại: {d.appealStatus === 'REDUCED' ? 'được chấp nhận, đã giảm về chế độ Chuẩn' : 'giữ nguyên quyết định'}
          {d.appealDecisionNote ? ` — ${d.appealDecisionNote}` : ''}
        </p>
      )}

      {canAppeal && (
        <div className="mt-1 flex flex-col gap-2 rounded-lg border border-line bg-surface-raised p-3">
          <p className="m-0 text-xs text-ink-muted">
            Bạn không đồng ý? Bạn được khiếu nại một lần trước {d.appealDeadline ? dateTime(d.appealDeadline) : 'hạn'}. Trong lúc chờ, các hạn chế do công nợ
            (nếu có) được tạm dừng.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Nêu rõ lý do và bằng chứng của bạn (tối thiểu 20 ký tự)"
            className="w-full rounded-lg border border-line bg-surface p-2.5 text-sm text-ink outline-none focus:border-accent"
          />
          <button
            type="button"
            disabled={appeal.isPending || reason.trim().length < 20}
            onClick={submit}
            className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {appeal.isPending ? 'Đang gửi...' : 'Gửi khiếu nại'}
          </button>
        </div>
      )}
    </div>
  );
}
