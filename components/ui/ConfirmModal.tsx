'use client';

/**
 * Hộp thoại xác nhận dùng chung (19/09/2026) — giao diện tham khảo Udemy ("Please confirm...").
 * Dùng cho các thao tác xóa Phần/Bài giảng trong "Chương trình giảng dạy" — trước đây xóa ngay
 * không hỏi lại, dễ bấm nhầm khi icon xóa nằm ngay cạnh tên (thay cho nút chữ "Xóa" cũ).
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
  title = 'Xác nhận',
  message,
  confirmLabel = 'Đồng ý',
  cancelLabel = 'Hủy',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-display text-base font-bold text-gray-900">{title}</h3>
          <button type="button" onClick={onCancel} className="shrink-0 text-gray-400 hover:text-gray-700">
            ✕
          </button>
        </div>
        <p className="mb-6 text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-gray-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
