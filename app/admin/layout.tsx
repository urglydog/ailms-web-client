'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LogoutSidebarButton } from '@/components/auth/LogoutSidebarButton';
import { useModerationQueue } from '@/hooks/useCourses';
import { api } from '@/lib/api/client';
import { getAccessToken, getCurrentRole } from '@/lib/auth/token';

interface InstructorRequestSummary {
  id: number;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const role = getCurrentRole();
    if (role !== 'ADMIN') {
      router.replace(role ? '/' : '/login');
    }
  }, [router]);

  // size:1 vì chỉ cần totalElements để hiện badge, không cần nội dung trang.
  const { data: pendingCoursesPage } = useModerationQueue({ status: 'PENDING', size: 1 });
  const { data: pendingRequests } = useQuery({
    queryKey: ['instructor-requests', 'PENDING'],
    queryFn: () =>
      api.get<InstructorRequestSummary[]>('/api/v1/instructor-requests?status=PENDING', {
        token: getAccessToken() ?? undefined,
      }),
    enabled: !!getAccessToken(),
  });

  const pendingCoursesCount = pendingCoursesPage?.totalElements ?? 0;
  const pendingRequestsCount = pendingRequests?.length ?? 0;

  const sidebarItems = [
    { id: 'overview', label: 'Tổng quan', href: '/admin', badge: 0 },
    { id: 'moderation', label: 'Kiểm duyệt khóa học', href: '/admin/moderation', badge: pendingCoursesCount },
    { id: 'users', label: 'Quản lý người dùng', href: '/admin/users', badge: pendingRequestsCount },
    { id: 'aiqueue', label: 'Giám sát AI Queue', href: '/admin/ai-queue', badge: 0 },
    { id: 'transactions', label: 'Đối soát giao dịch', href: '/admin/transactions', badge: 0 },
    { id: 'categories', label: 'Danh mục', href: '/admin/categories', badge: 0 },
    { id: 'settings', label: 'Cấu hình hệ thống', href: '/admin/settings', badge: 0 },
  ];

  return (
    <div className="flex min-h-dvh bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <div className="sticky top-0 flex min-h-dvh w-[240px] shrink-0 flex-col gap-5 bg-[#0F1B2B] px-4 py-6 self-start">
        <div className="flex items-center gap-[9px] px-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 font-display text-base font-bold text-white">
            L
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="font-display text-[15px] font-bold text-white">LinguaLearn</span>
            <span className="text-[11px] text-slate-400">Quản trị viên</span>
          </div>
        </div>
        
        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-[13.5px] font-semibold no-underline ${
                  isActive ? 'bg-cyan-400/15 text-cyan-300' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        
        <Link href="/" className="px-2 text-xs text-slate-400 no-underline hover:text-slate-300">
          ← Về trang học viên
        </Link>
        
        <div className="mt-auto border-t border-white/10 pt-3">
          <div className="flex items-center gap-2.5 px-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 font-display text-[12.5px] font-bold text-white">
              QT
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[12.5px] font-semibold text-white">Đỗ Thị Quản Trị</span>
              <span className="text-[11px] text-slate-400">Admin</span>
            </div>
          </div>
          <LogoutSidebarButton />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-[28px_32px] flex flex-col gap-[22px]">
        {children}
      </main>
    </div>
  );
}
