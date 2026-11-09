'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { duration, ease, scale } from '@/lib/motion/tokens';

/**
 * Khung popover/dropdown có hiệu ứng (đợt 3, PLAN_CaiTien_UIUX_Motion.md).
 *
 * Theo review-animations: popover phóng ra TỪ PHÍA NÚT BẤM (`transform-origin` theo góc neo),
 * bắt đầu từ scale 0.97 chứ không từ 0, mở 160ms ease-out, đóng nhanh hơn (100ms) vì đóng là
 * phản hồi của hệ thống. Chỉ animate opacity + transform. Mở/đóng bằng hover vẫn ngắt được giữa
 * chừng vì motion nối tiếp từ trạng thái hiện tại.
 */
export function PopoverMotion({
  open,
  origin = 'top right',
  className = '',
  children,
}: {
  open: boolean;
  /** Góc neo của popover so với nút bấm, vd "top right" (dropdown canh phải), "top left". */
  origin?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={className}
          style={{ transformOrigin: origin }}
          initial={{ opacity: 0, transform: `scale(${scale.enter}) translateY(-4px)` }}
          animate={{
            opacity: 1,
            transform: 'scale(1) translateY(0px)',
            transition: { duration: duration.fast, ease: ease.out },
          }}
          exit={{
            opacity: 0,
            transform: `scale(${scale.enter}) translateY(-2px)`,
            transition: { duration: duration.instant, ease: ease.out },
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
