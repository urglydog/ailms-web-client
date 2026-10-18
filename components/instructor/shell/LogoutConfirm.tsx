'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface LogoutConfirmProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Hộp xác nhận đăng xuất (sáng, dịch được); Escape để hủy. */
export function LogoutConfirm({ open, onCancel, onConfirm }: LogoutConfirmProps) {
  const t = useTranslations('instructor.shell');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-ink/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        aria-describedby="logout-body"
        className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-card-hover"
      >
        <h2 id="logout-title" className="m-0 mb-2 font-display text-lg font-bold text-ink">
          {t('logoutTitle')}
        </h2>
        <p id="logout-body" className="m-0 mb-6 text-sm text-ink-muted">
          {t('logoutBody')}
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-full bg-tint px-4 py-2 text-sm font-semibold text-accent-dark hover:bg-line">
            {t('cancel')}
          </button>
          <button type="button" onClick={onConfirm} className="rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
