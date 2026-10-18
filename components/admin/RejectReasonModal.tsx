'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const MIN_REASON_LENGTH = 20;

interface RejectReasonModalProps {
  courseTitle: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

/** BR-COURSE-04: lý do từ chối phải ≥20 ký tự — bộ đếm đổi màu theo thời gian thực; Escape để đóng. */
export function RejectReasonModal({ courseTitle, onConfirm, onClose, isSubmitting }: RejectReasonModalProps) {
  const t = useTranslations('admin.moderation.reject');
  const [reason, setReason] = useState('');
  const length = reason.trim().length;
  const isValid = length >= MIN_REASON_LENGTH;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-ink/40 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="reject-title" className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-card-hover">
        <h2 id="reject-title" className="m-0 font-display text-[16px] font-bold text-ink">
          {t('title')}
        </h2>
        <p className="mt-1 text-[13px] text-ink-muted">{t('body', { title: courseTitle })}</p>

        <label htmlFor="reject-reason" className="sr-only">
          {t('label')}
        </label>
        <textarea
          id="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          autoFocus
          placeholder={t('placeholder', { min: MIN_REASON_LENGTH })}
          className="mt-3 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
        />
        <div aria-live="polite" className={`mt-1 text-right text-[12px] font-semibold ${isValid ? 'text-success-ink' : 'text-danger'}`}>
          {t('counter', { count: length, min: MIN_REASON_LENGTH })}
        </div>

        <div className="mt-3 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="rounded-full bg-tint px-4 py-2 text-[13px] font-bold text-accent-dark hover:bg-line">
            {t('cancel')}
          </button>
          <button
            type="button"
            disabled={!isValid || isSubmitting}
            onClick={() => onConfirm(reason.trim())}
            className="rounded-full bg-danger px-4 py-2 text-[13px] font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
