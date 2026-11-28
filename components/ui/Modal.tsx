'use client';

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { X } from 'lucide-react';
import { duration, ease, scale } from '@/lib/motion/tokens';

/**
 * Hộp thoại dùng chung (đợt 2, PLAN_CaiTien_UIUX_Motion.md).
 *
 * Khả năng tiếp cận (WCAG 2.4.3, 4.1.2): role="dialog" + aria-modal, gắn tên bằng tiêu đề,
 * giữ focus bên trong khi mở (Tab/Shift+Tab vòng lại), Esc để đóng, trả focus về chỗ cũ khi đóng,
 * khóa cuộn trang nền.
 *
 * Chuyển động (review-animations): modal giữ gốc ở giữa (ngoại lệ được phép), vào bằng
 * opacity + scale 0.97 → 1 trong 220ms ease-out, ra nhanh hơn (160ms) vì là phản hồi của hệ thống.
 * Chỉ animate opacity và transform. MotionConfig reducedMotion="user" bỏ phần scale khi cần.
 */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Tiêu đề hiển thị và cũng là tên của hộp thoại cho trình đọc màn hình. */
  title?: ReactNode;
  /** Dùng khi không có tiêu đề hiển thị. */
  ariaLabel?: string;
  children: ReactNode;
  /** Phần nút ở chân hộp thoại. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Bấm ra ngoài để đóng (mặc định có). Tắt cho biểu mẫu dài để tránh mất dữ liệu. */
  closeOnBackdrop?: boolean;
  /** Ẩn nút X ở góc. */
  hideClose?: boolean;
  closeLabel?: string;
  className?: string;
  /** `alertdialog` cho xác nhận hành động nhạy cảm (đăng xuất, xóa, khóa). */
  role?: 'dialog' | 'alertdialog';
  /** Phần tử nhận focus khi mở (vd nút Hủy) — mặc định là phần tử bấm được đầu tiên. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** id của đoạn mô tả, gắn vào aria-describedby. */
  describedBy?: string;
  /** Lớp z-index (mặc định z-[300]); tăng khi mở từ một lớp phủ khác có z cao. */
  zClass?: string;
  /**
   * Giữ nguyên giao diện bên trong do nơi gọi tự dựng (đầu, thân, chân): Modal chỉ lo phần vỏ —
   * role, focus, Esc, portal, lớp phủ, hiệu ứng. Khi đó `className` là toàn bộ class của khung.
   */
  bare?: boolean;
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  ariaLabel,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  hideClose = false,
  closeLabel = 'Đóng',
  className = '',
  role = 'dialog',
  initialFocusRef,
  describedBy,
  zClass = 'z-[300]',
  bare = false,
}: ModalProps) {
  // Render qua portal vào <body>: `fixed` bên trong phần tử có transform/overflow sẽ bị cắt hoặc lệch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    // Chờ portal sẵn sàng (mounted) — nếu không, lần mở ngay khi render đầu sẽ không đặt được focus.
    if (!open || !mounted) return;
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus phần tử đầu tiên trong hộp thoại (hoặc chính hộp thoại).
    const first = initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panelRef.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.hasAttribute('disabled') && !el.closest('[hidden],[aria-hidden="true"]'),
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = items[0]!;
      const lastEl = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, [open, mounted, initialFocusRef]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <ModalLayer zClass={zClass}>
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-night/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: duration.normal, ease: ease.out } }}
            exit={{ opacity: 0, transition: { duration: duration.fast, ease: ease.out } }}
            onClick={closeOnBackdrop ? onClose : undefined}
          />
          <motion.div
            ref={panelRef}
            role={role}
            aria-describedby={describedBy}
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : ariaLabel}
            tabIndex={-1}
            className={
              bare
                ? `relative outline-none ${className}`
                : `relative flex max-h-[calc(100vh-2rem)] w-full ${SIZES[size]} flex-col overflow-hidden rounded-panel border border-line bg-surface-raised text-ink shadow-card-hover outline-none ${className}`
            }
            initial={{ opacity: 0, transform: `scale(${scale.enter}) translateY(6px)` }}
            animate={{
              opacity: 1,
              transform: 'scale(1) translateY(0px)',
              transition: { duration: duration.normal, ease: ease.out },
            }}
            exit={{
              opacity: 0,
              transform: `scale(${scale.enter}) translateY(0px)`,
              transition: { duration: duration.fast, ease: ease.out },
            }}
          >
            {bare ? (
              children
            ) : (
              <>
            {(title || !hideClose) && (
              <div className="flex items-start justify-between gap-3 px-6 pb-2 pt-5">
                {title ? (
                  <h2 id={titleId} className="m-0 font-display text-lg font-bold text-ink">
                    {title}
                  </h2>
                ) : (
                  <span />
                )}
                {!hideClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={closeLabel}
                    className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-150 hover:bg-tint hover:text-ink"
                  >
                    <X size={18} aria-hidden />
                  </button>
                )}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-1">{children}</div>
            {footer && (
              <div className="flex justify-end gap-3 border-t border-line-soft px-6 py-4">{footer}</div>
            )}
              </>
            )}
          </motion.div>
        </ModalLayer>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * Lớp phủ toàn màn hình. Khi đóng, AnimatePresence giữ lớp này trên màn hình thêm ~160ms cho hiệu
 * ứng thoát; trong lúc đó nó vẫn nhận chuột nên nuốt mất cú bấm đầu tiên vào nút bên dưới (vd "Thêm vào
 * giỏ" ngay sau khi đóng modal xem trước). Đang thoát thì tắt pointer-events để cú bấm đi xuyên qua.
 */
function ModalLayer({ zClass, children }: { zClass: string; children: ReactNode }) {
  const isPresent = useIsPresent();
  return (
    <div className={`fixed inset-0 ${zClass} flex items-center justify-center p-4${isPresent ? '' : ' pointer-events-none'}`}>
      {children}
    </div>
  );
}
