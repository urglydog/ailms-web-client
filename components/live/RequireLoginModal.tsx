'use client';

import Link from 'next/link';

interface RequireLoginModalProps {
  open: boolean;
  onClose: () => void;
  /** Câu dẫn theo đúng hành động bị chặn — ví dụ "chọn ngôn ngữ lồng tiếng" hoặc "gửi tin nhắn". */
  actionLabel: string;
}

/**
 * BR-LIVE-02 — Guest xem live PUBLIC bình thường, nhưng khi bấm hành động TƯƠNG TÁC (chọn ngôn
 * ngữ lồng tiếng — F11.3, gửi chat — F11.4) thì chặn lại bằng modal này thay vì cho thực hiện.
 * Dựng 1 lần ở đây (F11.2), F11.3/F11.4 import lại — không viết trùng theo đúng ghi chú trong
 * `doc/FEATURE_ASSIGNMENT.md`.
 *
 * Không kèm redirect-back-sau-đăng-nhập — `/login` chưa hỗ trợ query param đó, thêm vào đây sẽ
 * chỉ là tham số chết. Muốn có, làm ở luồng auth chung, không phải việc riêng của Live.
 */
export function RequireLoginModal({ open, onClose, actionLabel }: RequireLoginModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="card flex w-full max-w-sm flex-col gap-4 p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-bold text-ink">Cần đăng nhập</h2>
        <p className="text-sm text-ink-muted">
          Bạn cần đăng nhập để {actionLabel}. Xem buổi live thì không cần đăng nhập nhé.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/login"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-accent-dark"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink no-underline hover:bg-gray-50"
          >
            Đăng ký tài khoản mới
          </Link>
          <button
            onClick={onClose}
            className="mt-1 text-xs text-ink-faint hover:text-ink-muted"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
