'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useAppealDispute } from '@/hooks/useInstructorDisputes';
import { ApiError } from '@/lib/api/client';
import type { InstructorDisputeRes } from '@/types/domain';

const money = (n: number | null | undefined) => `${(n ?? 0).toLocaleString('vi-VN')}đ`;
const dateTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

/**
 * Quyết định hoàn tiền dành cho giảng viên (14/11/2026): giảng viên phải biết MÌNH BỊ TRỪ BAO NHIÊU, VÌ SAO (mã lý do + ghi chú + minh chứng
 * của admin) và còn quyền khiếu nại một lần khi bị quy "giảng viên chịu toàn bộ". Khiếu nại làm ngay trong khung này, không mở thêm cửa sổ.
 */
export function RefundDecisionPanel({ d }: { d: InstructorDisputeRes }) {
  const t = useTranslations('finance');
  const appeal = useAppealDispute();
  const [reason, setReason] = useState('');
  if (!d.refundResponsibility) return null;

  const canAppeal = d.refundResponsibility === 'INSTRUCTOR_FAULT' && (d.appealStatus ?? 'NONE') === 'NONE' && !!d.appealDeadline;
  const submit = () =>
    appeal.mutate(
      { id: d.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(t('refundDecision.appealSent'));
          setReason('');
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : t('refundDecision.appealFailed')),
      },
    );

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 text-sm text-ink">
      <h3 className="m-0 text-sm font-semibold text-ink">{t('refundDecision.title')}</h3>
      <p className="m-0">
        {t('refundDecision.mode')} <strong>{t(`refundResponsibility.${d.refundResponsibility}`)}</strong>. {t('refundDecision.charged')}{' '}
        <strong>{money(d.instructorCharge)}</strong>.
      </p>
      {d.refundReasonCode && <p className="m-0">{t('refundDecision.reason', { reason: t(`refundReason.${d.refundReasonCode}`) })}</p>}
      {d.refundNote && <p className="m-0 whitespace-pre-wrap">{t('refundDecision.adminNote', { note: d.refundNote })}</p>}
      {d.refundEvidenceNote && <p className="m-0 whitespace-pre-wrap">{t('refundDecision.evidence', { note: d.refundEvidenceNote })}</p>}

      {d.appealStatus === 'OPEN' && <p className="m-0 font-semibold text-accent-dark">{t('refundDecision.appealOpen')}</p>}
      {(d.appealStatus === 'UPHELD' || d.appealStatus === 'REDUCED') && (
        <p className="m-0">
          {t('refundDecision.appealResult', { result: d.appealStatus === 'REDUCED' ? t('refundDecision.appealReduced') : t('refundDecision.appealUpheld') })}
          {d.appealDecisionNote ? ` — ${d.appealDecisionNote}` : ''}
        </p>
      )}

      {canAppeal && (
        <div className="mt-1 flex flex-col gap-2 rounded-lg border border-line bg-surface-raised p-3">
          <p className="m-0 text-xs text-ink-muted">
            {t('refundDecision.appealHint', { deadline: d.appealDeadline ? dateTime(d.appealDeadline) : t('refundDecision.deadlineFallback') })}
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={t('refundDecision.placeholder')}
            className="w-full rounded-lg border border-line bg-surface p-2.5 text-sm text-ink outline-none focus:border-accent"
          />
          <button
            type="button"
            disabled={appeal.isPending || reason.trim().length < 20}
            onClick={submit}
            className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {appeal.isPending ? t('refundDecision.sending') : t('refundDecision.submit')}
          </button>
        </div>
      )}
    </div>
  );
}
