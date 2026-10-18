'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  /** `danger` tô đỏ nút xác nhận (khóa, xóa); `primary` tô xanh. */
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

/** Hộp xác nhận hành động nhạy cảm của khu Quản trị: Escape để hủy, tiêu điểm đặt vào nút Hủy (an toàn hơn khi bấm Enter). */
export function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, tone = 'danger', onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-ink/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-card-hover"
      >
        <h2 id="confirm-title" className="m-0 mb-2 font-display text-lg font-bold text-ink">
          {title}
        </h2>
        <p id="confirm-body" className="m-0 mb-6 text-sm text-ink-muted">
          {body}
        </p>
        <div className="flex justify-end gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} className="rounded-full bg-tint px-4 py-2 text-sm font-semibold text-accent-dark hover:bg-line">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white hover:opacity-90 ${tone === 'danger' ? 'bg-danger' : 'bg-accent'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
