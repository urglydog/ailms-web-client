'use client';

import { useId, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';

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

/**
 * Hộp xác nhận hành động nhạy cảm của khu Quản trị: Escape để hủy, tiêu điểm đặt vào nút Hủy
 * (an toàn hơn khi bấm Enter). Dựng trên `Modal` chung (giữ focus, trả focus, hiệu ứng vào/ra).
 */
export function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, tone = 'danger', onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const bodyId = useId();

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      role="alertdialog"
      describedBy={bodyId}
      initialFocusRef={cancelRef}
      size="sm"
      hideClose
      footer={
        <>
          <button ref={cancelRef} type="button" onClick={onCancel} className="rounded-full bg-tint px-4 py-2 text-sm font-semibold text-accent-dark transition-colors duration-150 hover:bg-line">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`btn-tactile rounded-full px-4 py-2 text-sm font-semibold text-white hover:opacity-90 ${tone === 'danger' ? 'bg-danger' : 'bg-accent'}`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p id={bodyId} className="m-0 text-sm text-ink-muted">
        {body}
      </p>
    </Modal>
  );
}
