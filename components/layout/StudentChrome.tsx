'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { DiscoveryChat } from '@/components/chat/DiscoveryChat';

/**
 * Khung Header/Footer/chat của nhóm trang học viên. Ẩn hẳn khi đang LÀM BÀI THI (`/exam/{id}?mode=taking`)
 * — trước đây menu + avatar vẫn hiện trong phòng thi, bấm nhầm tab là rời bài giữa chừng (camera/
 * chia sẻ màn hình bị bỏ rơi, vào lại phải xin quyền lại).
 */
export function StudentChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isTakingExam = /^\/exam\/[^/]+\/?$/.test(pathname ?? '') && searchParams.get('mode') === 'taking';

  // GIỮ NGUYÊN cấu trúc cây (Header/Footer/chat chỉ chuyển true/false trong cùng vị trí): nếu trả
  // 2 cây khác nhau thì `children` (trang thi) bị unmount rồi mount lại ngay khi chuyển sang
  // mode=taking → mất state, dừng camera/màn hình vừa xin, học viên phải bấm "Bắt đầu" lần nữa.
  return (
    <div className="flex min-h-dvh flex-col">
      {!isTakingExam && <Header />}
      <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      {!isTakingExam && <Footer />}
      {!isTakingExam && <DiscoveryChat />}
    </div>
  );
}
