'use client';

import { useTranslations } from 'next-intl';
import { Modal } from './Modal';

/**
 * Hộp thoại xác nhận dùng chung (19/09/2026) — giao diện tham khảo Udemy ("Please confirm...").
 * Dùng cho các thao tác xóa Phần/Bài giảng trong "Chương trình giảng dạy" — trước đây xóa ngay
 * không hỏi lại, dễ bấm nhầm khi icon xóa nằm ngay cạnh tên (thay cho nút chữ "Xóa" cũ).
 *
 * (08/11/2026) Dựng trên `Modal` chung: role dialog, giữ focus, Esc, trả focus, hiệu ứng vào/ra.
 * Nơi gọi chỉ render khi cần hỏi, nên luôn `open`.
 */
interface ConfirmModalProps {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const t = useTranslations('common.confirm');
  return (
    <Modal
      open
      onClose={onCancel}
      title={title ?? t('title')}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-accent-dark transition-colors duration-150 hover:bg-tint"
          >
            {cancelLabel ?? t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-tactile rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-dark"
          >
            {confirmLabel ?? t('ok')}
          </button>
        </>
      }
    >
      <p className="m-0 text-sm text-ink-muted">{message}</p>
    </Modal>
  );
}
