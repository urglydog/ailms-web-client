'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Component phân trang dùng chung — trước đây `admin/users` và `admin/transactions/payments`
 * tự viết cùng 1 pattern Trước/Sau riêng lẻ, trích xuất ra đây để tái dùng thay vì copy-paste lần 3. */
export function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between pt-3 ${className}`}>
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1.5 border border-line rounded-card text-xs font-semibold text-ink-muted hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Trang trước
      </button>
      <span className="text-xs text-ink-muted">Trang {currentPage}/{totalPages}</span>
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1.5 border border-line rounded-card text-xs font-semibold text-ink-muted hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Trang sau
      </button>
    </div>
  );
}
