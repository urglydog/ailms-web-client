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

  if (isTakingExam) {
    return (
      <div className="flex min-h-dvh flex-col">
        <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      <Footer />
      <DiscoveryChat />
    </div>
  );
}
