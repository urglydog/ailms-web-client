'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogoutSidebarButton } from '@/components/auth/LogoutSidebarButton';
import { UploadTray } from '@/components/instructor/UploadTray';
import { InstructorChat } from '@/components/chat/InstructorChat';
import { getCurrentRole } from '@/lib/auth/token';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const role = getCurrentRole();
    if (role !== 'INSTRUCTOR') {
      router.replace(role ? '/' : '/login');
    }
  }, [router]);

  const sidebarItems = [
    { id: 'overview', label: 'Tổng quan', href: '/instructor' },
    { id: 'courseslist', label: 'Khóa học của tôi', href: '/instructor/courses' },
    { id: 'materials', label: 'Kho Học Liệu & Đề Thi', href: '/instructor/materials' },
    { id: 'live', label: 'Live', href: '/instructor/live' },
    { id: 'revenue', label: 'Thống kê doanh thu', href: '/instructor/revenue' },
    { id: 'students', label: 'Học viên', href: '/instructor/students' },
  ];

  return (
    <div className="flex min-h-dvh bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <div className="sticky top-0 flex min-h-dvh w-[240px] shrink-0 flex-col gap-6 bg-[#0F1B2B] px-4 py-6 self-start">
        <div className="flex items-center gap-[9px] px-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 font-display text-base font-bold text-white">
            L
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="font-display text-[15px] font-bold text-white">LinguaLearn</span>
            <span className="text-[11px] text-slate-400">Giảng viên</span>
          </div>
        </div>
        
        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/instructor' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`block rounded-lg px-3.5 py-2.5 text-[13.5px] font-semibold no-underline ${
                  isActive ? 'bg-cyan-400/15 text-cyan-300' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {item.label}
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
              TH
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[12.5px] font-semibold text-white">Trần Thanh Hà</span>
              <span className="text-[11px] text-slate-400">Giảng viên</span>
            </div>
          </div>
          <LogoutSidebarButton />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-[28px_32px] flex flex-col gap-[22px]">
        {children}
      </main>

      <UploadTray />
      <InstructorChat />
    </div>
  );
}
