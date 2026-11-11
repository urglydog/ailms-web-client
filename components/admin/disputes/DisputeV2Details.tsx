'use client';

import { useTranslations } from 'next-intl';
import type { DisputeAdminRes, DisputeEligibility, InstructorDecision, RefundResponsibility } from '@/types/domain';

const ELIGIBILITY_CLASS: Record<DisputeEligibility, string> = {
  AUTO_ELIGIBLE: 'bg-success-tint text-success-ink border-success/30',
  EXCEPTION: 'bg-tint text-accent-dark border-accent/30',
  OUT_OF_POLICY: 'bg-danger/10 text-danger border-danger/30',
};
const DECISION_CLASS: Record<InstructorDecision, string> = {
  AGREE_REFUND: 'bg-success-tint text-success-ink border-success/30',
  OBJECT: 'bg-danger/10 text-danger border-danger/30',
  NO_RESPONSE: 'bg-line-soft text-ink-muted border-line',
};

const money = (n: number | null | undefined) => `${(n ?? 0).toLocaleString('vi-VN')}đ`;

/** Số tiền giảng viên bị trừ / nền tảng gánh theo chế độ trách nhiệm — PHẢI khớp `RefundService.instructorCharge` ở BE
 * (BE luôn tính lại, đây chỉ là bản xem trước cho admin). */
export function previewRefund(
  d: Pick<DisputeAdminRes, 'amount' | 'instructorEarning'>,
  responsibility: RefundResponsibility,
): { instructorCharge: number; platformShare: number } {
  const earning = d.instructorEarning ?? 0;
  const instructorCharge =
    responsibility === 'STANDARD' ? earning : responsibility === 'PLATFORM_COMPENSATES' ? 0 : d.amount;
  return { instructorCharge, platformShare: d.amount - instructorCharge };
}

/** Phần thông tin khiếu nại v2 trong modal xử lý của admin (11/11/2026): lý do chuẩn hóa, điều kiện hoàn,
 * phản hồi của giảng viên + minh chứng của giảng viên. */
export function DisputeV2Details({ d }: { d: DisputeAdminRes }) {
  const t = useTranslations('admin.disputes.v2');
  const dateTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  const studentFiles = d.attachments.filter((a) => a.side !== 'INSTRUCTOR');
  const instructorFiles = d.attachments.filter((a) => a.side === 'INSTRUCTOR');

  return (
    <div className="mt-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {d.category && (
          <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink">
            {t(`category.${d.category}`)}
          </span>
        )}
        {d.eligibility && (
          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${ELIGIBILITY_CLASS[d.eligibility]}`}>
            {t(`eligibility.${d.eligibility}`)}
          </span>
        )}
        {d.progressPctAtFiling != null && (
          <span className="text-xs text-ink-muted">{t('progress', { percent: d.progressPctAtFiling })}</span>
        )}
      </div>

      {studentFiles.length > 0 && d.attachments.length !== studentFiles.length && (
        <p className="m-0 text-xs text-ink-muted">{t('studentFiles', { count: studentFiles.length })}</p>
      )}

      <div className="rounded-lg border border-line bg-surface p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="m-0 text-sm font-semibold text-ink">{t('instructor.title')}</h3>
          {d.instructorDecision ? (
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${DECISION_CLASS[d.instructorDecision]}`}>
              {t(`decision.${d.instructorDecision}`)}
            </span>
          ) : (
            <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-ink-muted">
              {t('instructor.waiting')}
            </span>
          )}
        </div>
        {d.instructorResponse ? (
          <p className="m-0 whitespace-pre-wrap text-sm text-ink">{d.instructorResponse}</p>
        ) : (
          <p className="m-0 text-xs text-ink-muted">
            {d.instructorDeadlineAt ? t('instructor.deadline', { time: dateTime(d.instructorDeadlineAt) }) : t('instructor.none')}
          </p>
        )}
        {d.instructorRespondedAt && (
          <p className="m-0 mt-1 text-xs text-ink-muted">{t('instructor.respondedAt', { time: dateTime(d.instructorRespondedAt) })}</p>
        )}
        {instructorFiles.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {instructorFiles.map((a) => (
              <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-line bg-surface-raised px-2.5 py-1.5 text-xs font-semibold text-accent-dark hover:bg-tint">
                {t('instructor.file', { type: a.fileType })}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Chọn chế độ trách nhiệm khi hoàn tiền + xem trước số tiền. */
export function ResponsibilityPicker({
  d,
  value,
  onChange,
}: {
  d: DisputeAdminRes;
  value: RefundResponsibility;
  onChange: (v: RefundResponsibility) => void;
}) {
  const t = useTranslations('admin.disputes.v2');
  const options: RefundResponsibility[] = ['STANDARD', 'PLATFORM_COMPENSATES', 'INSTRUCTOR_FAULT'];
  const preview = previewRefund(d, value);
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-1 text-sm font-semibold text-ink">{t('responsibility.title')}</legend>
      {options.map((opt) => (
        <label
          key={opt}
          className={`flex cursor-pointer gap-2.5 rounded-lg border p-3 text-sm ${value === opt ? 'border-accent bg-tint' : 'border-line bg-surface-raised'}`}
        >
          <input type="radio" name="responsibility" value={opt} checked={value === opt} onChange={() => onChange(opt)} className="mt-0.5" />
          <span className="flex flex-col gap-0.5">
            <span className="font-semibold text-ink">{t(`responsibility.${opt}.label`)}</span>
            <span className="text-xs text-ink-muted">{t(`responsibility.${opt}.hint`)}</span>
          </span>
        </label>
      ))}
      <div className="rounded-lg bg-surface px-3 py-2 text-xs text-ink">
        {t('responsibility.preview', {
          learner: money(d.amount),
          instructor: money(preview.instructorCharge),
          platform: money(preview.platformShare),
        })}
      </div>
    </fieldset>
  );
}

/** Tóm tắt hoàn tiền đã duyệt + bước chuyển khoản. */
export function RefundSummary({
  d,
  transferRef,
  onTransferRefChange,
  onMarkTransferred,
  submitting,
}: {
  d: DisputeAdminRes;
  transferRef: string;
  onTransferRefChange: (v: string) => void;
  onMarkTransferred: () => void;
  submitting: boolean;
}) {
  const t = useTranslations('admin.disputes.v2');
  if (d.status !== 'RESOLVED_REFUNDED' && d.status !== 'REOPENED') return null;
  if (!d.refundResponsibility) return null;
  return (
    <div className="mt-5 flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <h3 className="m-0 text-sm font-semibold text-ink">{t('refund.title')}</h3>
      <p className="m-0 text-sm text-ink">
        {t('refund.summary', {
          mode: t(`responsibility.${d.refundResponsibility}.label`),
          instructor: money(d.refundInstructorCharge),
          platform: money(d.refundPlatformShare),
        })}
      </p>
      {d.refundTransferStatus === 'TRANSFERRED' ? (
        <p className="m-0 text-sm font-semibold text-success-ink">{t('refund.transferred', { ref: d.refundTransferRef ?? '' })}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-xs text-ink-muted">{t('refund.pending')}</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={transferRef}
              maxLength={100}
              onChange={(e) => onTransferRefChange(e.target.value)}
              placeholder={t('refund.refPh')}
              aria-label={t('refund.refPh')}
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
            />
            <button
              type="button"
              disabled={submitting || !transferRef.trim()}
              onClick={onMarkTransferred}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {t('refund.markTransferred')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
