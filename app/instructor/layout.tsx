'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { UploadTray } from '@/components/instructor/UploadTray';
import { InstructorChat } from '@/components/chat/InstructorChat';
import { InstructorNavDrawer } from '@/components/instructor/shell/InstructorNavDrawer';
import { InstructorSidebar } from '@/components/instructor/shell/InstructorSidebar';
import { InstructorTopbar } from '@/components/instructor/shell/InstructorTopbar';
import { LogoutConfirm } from '@/components/instructor/shell/LogoutConfirm';
import { LanguageModal } from '@/components/layout/LanguageModal';
import { getCurrentRole } from '@/lib/auth/token';
import { activeNavItem, isFullPageRoute } from '@/lib/instructor/nav';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const COLLAPSED_KEY = 'instructor-sidebar-collapsed';

/**
 * Khung Kênh giảng viên (thiết kế lại): thanh bên sáng có nhãn luôn hiện (thu gọn được thành cột icon, nhớ lựa chọn),
 * thanh trên có tên mục, nút Tạo khóa học, thông báo và menu tài khoản; dưới `md` thay bằng ngăn kéo.
 *
 * "Kho Học Liệu & Đề Thi"/"Live"/"Mã giảm giá" nằm trong trang "Công cụ" (xem `app/instructor/tools/page.tsx`); không có
 * trang "Tổng quan"/"Học viên" riêng vì đã có tab trong "Hiệu suất" (`app/instructor/revenue/layout.tsx`).
 *
 * "Tạo khóa học mới" và trang chỉnh sửa khóa (`/edit/*`) là màn hình TOÀN TRANG riêng (tự có thanh trên + mini-nav), nên
 * bỏ qua toàn bộ khung này cho 2 nhóm route đó.
 */
export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('instructor');
  const router = useRouter();
  const pathname = usePathname();
  const { data: currentUser } = useCurrentUser();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    if (!getCurrentRole()) router.replace('/login');
  }, [router]);

  // Đọc lựa chọn thu gọn sau khi mount để HTML máy chủ và máy khách khớp nhau.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === '1');
    } catch {
      /* không có localStorage thì giữ mặc định mở rộng */
    }
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        /* bỏ qua */
      }
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };

  if (isFullPageRoute(pathname)) return <>{children}</>;

  const active = activeNavItem(pathname);
  const title = active ? t(`nav.${active.id}`) : t('shell.channel');

  return (
    <div className="flex min-h-dvh bg-surface font-sans text-ink">
      <InstructorSidebar pathname={pathname} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      <InstructorNavDrawer open={mobileNavOpen} onClose={closeMobileNav} pathname={pathname} />

      <div className="flex min-w-0 flex-1 flex-col">
        <InstructorTopbar
          title={title}
          user={{ fullName: currentUser?.fullName ?? t('shell.loading'), avatarUrl: currentUser?.avatarUrl ?? null }}
          onOpenMenu={() => setMobileNavOpen(true)}
          onOpenLanguage={() => setShowLanguage(true)}
          onLogout={() => setShowLogout(true)}
        />
        <main id="main-content" tabIndex={-1} className="flex min-w-0 flex-1 flex-col gap-[18px] p-4 sm:p-5 md:gap-[22px] md:p-[28px_32px]">
          {children}
        </main>
      </div>

      {showLanguage && <LanguageModal onClose={() => setShowLanguage(false)} />}
      <LogoutConfirm open={showLogout} onCancel={() => setShowLogout(false)} onConfirm={handleLogout} />
      <UploadTray />
      <InstructorChat />
    </div>
  );
}
