'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { disputesApi } from '@/lib/api/disputes';
import { payosPayoutApi } from '@/lib/api/payosPayout';
import { getAccessToken } from '@/lib/auth/token';
import { BLOCKED_REFRESH_MS, clockTime, isRetryBlocked } from '@/lib/payosRetry';
import { REASON_CODES } from '@/lib/refundPolicy';
import type { AppealDecision, DisputeAdminRes, RefundReasonCode, RefundResponsibility } from '@/types/domain';

export { REASON_CODES, REASON_LABEL } from '@/lib/refundPolicy';

const INPUT = 'w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent';

/** Vấn đề chính sách đang chặn nút "Đánh dấu đã hoàn tiền" — trả về khóa dịch trong admin.disputes.policy (BE kiểm lại, đây chỉ để chặn sớm và giải thích). */
export type PolicyProblem = 'needReason' | 'noteShort' | 'evidenceShort' | 'waitInstructor';

export function policyProblem(
  d: DisputeAdminRes,
  responsibility: RefundResponsibility,
  reasonCode: RefundReasonCode | '',
  note: string,
  evidenceNote: string,
): PolicyProblem | null {
  if (responsibility !== 'STANDARD' && reasonCode === '') return 'needReason';
  if (responsibility === 'INSTRUCTOR_FAULT') {
    if (note.trim().length < 10) return 'noteShort';
    if (evidenceNote.trim().length < 20) return 'evidenceShort';
    const waiting = d.instructorDecision == null && d.instructorDeadlineAt != null && new Date(d.instructorDeadlineAt).getTime() > Date.now();
    if (waiting) return 'waitInstructor';
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
  problem: PolicyProblem | null;
}) {
  const t = useTranslations('admin.disputes');
  const codes = REASON_CODES[responsibility];
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">{t('policy.reasonCode')} {responsibility === 'STANDARD' ? t('policy.optional') : '*'}</span>
        <select value={reasonCode} onChange={(e) => onReasonCode(e.target.value as RefundReasonCode | '')} className={INPUT}>
          <option value="">{responsibility === 'STANDARD' ? t('policy.none') : t('policy.choose')}</option>
          {codes.map((c) => (
            <option key={c} value={c}>{t(`reasonCode.${c}`)}</option>
          ))}
        </select>
      </label>
      {responsibility === 'INSTRUCTOR_FAULT' && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">{t('policy.evidence')}</span>
          <textarea
            value={evidenceNote}
            onChange={(e) => onEvidenceNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={t('policy.evidencePh')}
            className={INPUT}
          />
          <span className="text-xs text-ink-muted">
            {t('policy.evidenceHint')}
          </span>
        </label>
      )}
      {problem && <p className="m-0 text-xs text-danger">{t(`policy.${problem}`)}</p>}
    </div>
  );
}

/** Tài khoản nhận hoàn tiền học viên khai báo + trạng thái xác nhận chính chủ. */
export function RefundAccountInfo({ d }: { d: DisputeAdminRes }) {
  const t = useTranslations('admin.disputes.account');
  if (!d.refundBankCode) {
    return (
      <p className="m-0 text-xs text-ink-muted">
        {t('noStandard', { free: d.refundBankAccount ? t('freeNote', { note: d.refundBankAccount }) : '' })}
      </p>
    );
  }
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink">
      <div>
        <span className="font-semibold">{d.refundBankCode}</span> · <span className="font-mono">{d.refundAccountNumber}</span>
      </div>
      <div className="text-xs text-ink-muted">
        {t('holder', { name: d.refundAccountHolder ?? '', state: d.refundAccountConfirmed ? t('confirmed') : t('unconfirmed') })}
      </div>
    </div>
  );
}

/** Nút "Chi qua PayOS" cho khoản hoàn đang chờ chuyển + trạng thái lệnh chi gần nhất. Chỉ hiện khi công tắc chi tự động bật. */
export function PayosRefundTransfer({ d, onChanged }: { d: DisputeAdminRes; onChanged: () => void }) {
  const t = useTranslations('admin.disputes.payos');
  const locale = useLocale();
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
    // Lệnh chi chạy nền: còn đang xử lý thì tự làm mới 10 giây/lần để thấy kết quả mà không phải đóng mở lại hộp thoại.
    refetchInterval: (q) => {
      const o = q.state.data?.[0];
      if (o && (o.status === 'PENDING' || o.status === 'SUBMITTED' || o.status === 'UNKNOWN')) return 10_000;
      // Đang bị chặn chi lại theo thời gian: làm mới định kỳ để nút tự mở đúng lúc BE cho phép.
      return isRetryBlocked(o) ? BLOCKED_REFRESH_MS : false;
    },
  });
  const latestStatus = orders?.[0]?.status;
  const wasInFlight = useRef(false);
  useEffect(() => {
    const inFlightNow = latestStatus === 'PENDING' || latestStatus === 'SUBMITTED' || latestStatus === 'UNKNOWN';
    // Vừa chuyển từ "đang xử lý" sang "thành công": tải lại khiếu nại để hiện trạng thái đã hoàn tiền.
    if (wasInFlight.current && latestStatus === 'SUCCEEDED') onChanged();
    wasInFlight.current = inFlightNow;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ phản ứng khi trạng thái lệnh đổi
  }, [latestStatus]);
  const transfer = useMutation({
    mutationFn: () => payosPayoutApi.transferRefund(d.id),
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

  const askAccount = useMutation({
    mutationFn: () =>
      disputesApi.requestAccountUpdate(d.id, {
        reason: (orders?.[0]?.errorMessage ?? t('checkAccount')).slice(0, 280),
      }),
    onSuccess: () => {
      toast.success(t('asked'));
      onChanged();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : t('askError')),
  });

  if (!status?.enabled) return null;
  const latest = orders?.[0];
  const blocked = !d.refundBankCode || !d.refundAccountConfirmed;
  const inFlight = latest && (latest.status === 'PENDING' || latest.status === 'SUBMITTED');
  const retryBlocked = isRetryBlocked(latest);
  const accountChangedAt = clockTime(d.refundAccountUpdatedAt);
  const retryAt = retryBlocked ? clockTime(latest?.nextRetryAt) : null;
  const blockedLabel = retryBlocked ? (retryAt ? t('retryAt', { time: retryAt }) : t('locked')) : null;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface-raised p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={transfer.isPending || blocked || !!inFlight || retryBlocked}
          onClick={() => transfer.mutate()}
          title={
            retryBlocked
              ? (latest?.retryBlockedReason ?? t('blocked'))
              : blocked
                ? t('needAccount')
                : t('hint')
          }
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {blockedLabel ?? (latest?.status === 'FAILED' ? t('retry') : t('send'))}
        </button>
        {latest?.status === 'FAILED' && (
          <button
            type="button"
            disabled={askAccount.isPending}
            onClick={() => askAccount.mutate()}
            title={t('askHint')}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-raised disabled:opacity-50"
          >
            {t('ask')}
          </button>
        )}
        <span className="text-xs text-ink-muted">
          {t('balance', { amount: status.balance == null ? t('unknownBalance') : `${status.balance.toLocaleString(locale)}đ` })}
        </span>
      </div>
      {blocked && <p className="m-0 text-xs text-ink-muted">{t('notReady')}</p>}
      {latest && (inFlight || latest.status === 'UNKNOWN') && (
        <p className="m-0 text-xs font-semibold text-danger">
          {t('inFlight')}
        </p>
      )}
      {accountChangedAt && (
        <p className="m-0 text-xs font-semibold text-warning">
          {t('accountChanged', { time: accountChangedAt })}
        </p>
      )}
      {latest && (
        <p className="m-0 text-xs text-ink">
          {t('order', { ref: latest.referenceId, state: latest.status === 'SUCCEEDED' ? t('ok') : latest.status === 'FAILED' ? `${t('fail')}${latest.failureCategory ? ` (${t(`cause.${latest.failureCategory}`)})` : ''}` : latest.status === 'UNKNOWN' ? t('unknown') : t('pending') })}
          {latest.errorMessage ? ` — ${latest.errorMessage}` : ''}
          {retryBlocked && latest.retryBlockedReason ? `. ${latest.retryBlockedReason}` : ''}
          {latest.nameMismatch ? t('nameMismatch', { name: latest.resolvedAccountName ?? '' }) : ''}
        </p>
      )}
    </div>
  );
}

/** Khiếu nại của giảng viên với quyết định "giảng viên chịu toàn bộ": admin giữ nguyên hoặc giảm về chế độ Chuẩn. */
export function AppealPanel({ d, onChanged }: { d: DisputeAdminRes; onChanged: () => void }) {
  const t = useTranslations('admin.disputes.appeal');
  const [note, setNote] = useState('');
  const decide = useMutation({
    mutationFn: (decision: AppealDecision) => disputesApi.decideAppeal(d.id, { decision, note: note.trim() }),
    onSuccess: () => {
      toast.success(t('decided'));
      setNote('');
      onChanged();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : t('error')),
  });

  if (!d.appealStatus || d.appealStatus === 'NONE') return null;
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-lg border border-warning bg-surface p-4">
      <h3 className="m-0 text-sm font-semibold text-ink">{t('title')}</h3>
      {d.appealReason && <p className="m-0 whitespace-pre-wrap text-sm text-ink">{d.appealReason}</p>}
      {d.appealStatus === 'OPEN' ? (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-muted">{t('reason')}</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} className={INPUT} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={decide.isPending || !note.trim()}
              onClick={() => decide.mutate('REDUCE_TO_STANDARD')}
              title={t('reduceHint')}
              className="rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {t('reduce')}
            </button>
            <button
              type="button"
              disabled={decide.isPending || !note.trim()}
              onClick={() => decide.mutate('UPHOLD')}
              className="rounded-lg bg-surface-raised px-4 py-2 text-sm font-semibold text-danger ring-1 ring-inset ring-danger/40 hover:bg-danger/5 disabled:opacity-50"
            >
              {t('uphold')}
            </button>
          </div>
        </>
      ) : (
        <p className="m-0 text-xs text-ink-muted">
          {t('result', { outcome: d.appealStatus === 'REDUCED' ? t('reduced') : t('upheld') })}
          {d.appealDecisionNote ? ` — ${d.appealDecisionNote}` : ''}
        </p>
      )}
    </div>
  );
}
