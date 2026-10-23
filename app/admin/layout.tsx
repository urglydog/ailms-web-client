'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { AdminNavDrawer } from '@/components/admin/shell/AdminNavDrawer';
import { AdminSidebar } from '@/components/admin/shell/AdminSidebar';
import { AdminTopbar } from '@/components/admin/shell/AdminTopbar';
import { LogoutConfirm } from '@/components/instructor/shell/LogoutConfirm';
import { LanguageModal } from '@/components/layout/LanguageModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useModerationQueue } from '@/hooks/useCourses';
import { getCurrentRole, getAccessToken } from '@/lib/auth/token';
import { activeAdminItem } from '@/lib/admin/nav';
import { disputesApi } from '@/lib/api/disputes';

const COLLAPSED_KEY = 'admin-sidebar-collapsed';

/**
 * Khung khu Quản trị (thiết kế lại): thanh bên sáng chia nhóm có nhãn luôn hiện (thu gọn được thành cột icon, nhớ lựa chọn),
 * thanh trên có tên mục, thông báo và menu tài khoản; dưới `md` thay bằng ngăn kéo. Chỉ ADMIN được vào.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('admin');
  const router = useRouter();
  const pathname = usePathname();
  const { data: currentUser } = useCurrentUser();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    const role = getCurrentRole();
    if (role !== 'ADMIN') router.replace(role ? '/' : '/login');
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

  // size:1 vì chỉ cần totalElements để hiện số trên mục Kiểm duyệt.
  const { data: pendingPage } = useModerationQueue({ status: 'PENDING', size: 1 });
  const pendingCourses = pendingPage?.totalElements ?? 0;

  const { data: openDisputesList } = useQuery({
    queryKey: ['admin', 'disputes', 'open-count'],
    queryFn: () => disputesApi.listAllAdmin('OPEN'),
    enabled: !!getAccessToken(),
    refetchInterval: 30000,
  });
  const openDisputes = openDisputesList?.length ?? 0;

  const active = activeAdminItem(pathname);
  const title = active ? t(`nav.${active.id}`) : t('shell.panel');

  return (
    <div className="flex min-h-dvh bg-surface font-sans text-ink">
      <AdminSidebar pathname={pathname} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} pendingCourses={pendingCourses} openDisputes={openDisputes} />
      <AdminNavDrawer open={mobileNavOpen} onClose={closeMobileNav} pathname={pathname} pendingCourses={pendingCourses} openDisputes={openDisputes} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
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
    </div>
  );
}
