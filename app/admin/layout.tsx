'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, LayoutDashboard, Users, ShieldCheck, Tags, Star, BarChart, Activity, Mic, Shield, DollarSign, Ticket, Bell, Settings, Folder } from 'lucide-react';
import { LogoutSidebarButton } from '@/components/auth/LogoutSidebarButton';
import { useModerationQueue } from '@/hooks/useCourses';
import { getAccessToken, getCurrentRole } from '@/lib/auth/token';

type SidebarItem = { id: string; label: string; href: string; badge: number; icon: React.ElementType };
type SidebarGroup = { groupId: string; groupLabel: string; icon: React.ElementType; items: SidebarItem[] };

const COLLAPSED_GROUPS_STORAGE_KEY = 'admin-sidebar-collapsed-groups';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [userInfo, setUserInfo] = useState<{name: string, role: string, initials: string} | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Nhớ nhóm nào admin đã thu gọn, chỉ riêng trình duyệt này (tiện cho cá nhân, không cần đồng
  // bộ giữa các admin khác).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COLLAPSED_GROUPS_STORAGE_KEY);
      if (raw) setCollapsedGroups(JSON.parse(raw));
    } catch {
      // bỏ qua — vẫn hiện mặc định mở hết nếu đọc localStorage lỗi
    }
  }, []);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        window.localStorage.setItem(COLLAPSED_GROUPS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // bỏ qua — chỉ mất nhớ trạng thái thu gọn, không ảnh hưởng chức năng
      }
      return next;
    });
  };

  useEffect(() => {
    const role = getCurrentRole();
    if (role !== 'ADMIN') {
      router.replace(role ? '/' : '/login');
    }

    // Lấy thông tin user
    const token = getAccessToken();
    if (token) {
      try {
        const payload = token.split('.')[1];
        if (payload) {
          const decoded = JSON.parse(atob(payload));
          const nameStr = decoded.name || decoded.fullName || decoded.sub || decoded.email || 'Admin';
          
          let roleStr = 'Admin';
          if (typeof decoded.role === 'string') roleStr = decoded.role;
          else if (Array.isArray(decoded.roles)) roleStr = decoded.roles[0] || 'Admin';
          else if (typeof decoded.roles === 'string') roleStr = decoded.roles;
          
          // Tạo 1-2 chữ cái đầu
          const words = nameStr.split(' ');
          let initials = words[0].charAt(0).toUpperCase();
          if (words.length > 1) {
            initials += words[words.length - 1].charAt(0).toUpperCase();
          }

          setUserInfo({ name: nameStr, role: roleStr, initials });
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [router]);

  // size:1 vì chỉ cần totalElements để hiện badge, không cần nội dung trang.
  const { data: pendingCoursesPage } = useModerationQueue({ status: 'PENDING', size: 1 });

  const pendingCoursesCount = pendingCoursesPage?.totalElements ?? 0;

  // Tổng quan + Quản lý người dùng đứng riêng (dùng hàng ngày nhất); các tab còn lại gom theo
  // nhóm cha-con vì trước đây 13 tab phẳng có nhiều cặp cùng mảng nhưng tách rời (AI Analytics/
  // Giám sát AI Queue/Giọng đọc lồng tiếng/Bảo mật AI Tutor đều là AI; Đối soát giao dịch/Mã
  // giảm giá đều là tài chính...). Không đổi href nào để không vỡ link cũ.
  const topLevelItems: SidebarItem[] = [
    { id: 'overview', label: 'Tổng quan', href: '/admin', badge: 0, icon: LayoutDashboard },
    { id: 'users', label: 'Quản lý người dùng', href: '/admin/users', badge: 0, icon: Users },
  ];

  const sidebarGroups: SidebarGroup[] = [
    {
      groupId: 'content',
      groupLabel: 'Nội dung khóa học',
      icon: Folder,
      items: [
        { id: 'moderation', label: 'Kiểm duyệt khóa học', href: '/admin/moderation', badge: pendingCoursesCount, icon: ShieldCheck },
        { id: 'categories', label: 'Danh mục', href: '/admin/categories', badge: 0, icon: Tags },
        { id: 'reviews', label: 'Đánh giá', href: '/admin/reviews', badge: 0, icon: Star },
      ],
    },
    {
      groupId: 'ai',
      groupLabel: 'AI & Tự động hoá',
      icon: Activity,
      items: [
        { id: 'aianalytics', label: 'AI Analytics', href: '/admin/ai-analytics', badge: 0, icon: BarChart },
        { id: 'aiqueue', label: 'Giám sát AI Queue', href: '/admin/ai-queue', badge: 0, icon: Activity },
        { id: 'voice-mappings', label: 'Giọng đọc lồng tiếng', href: '/admin/voice-mappings', badge: 0, icon: Mic },
        { id: 'tutor-security', label: 'Bảo mật AI Tutor', href: '/admin/tutor-security', badge: 0, icon: Shield },
      ],
    },
    {
      groupId: 'finance',
      groupLabel: 'Tài chính',
      icon: DollarSign,
      items: [
        { id: 'transactions', label: 'Đối soát giao dịch', href: '/admin/transactions/payments', badge: 0, icon: DollarSign },
        { id: 'coupons', label: 'Mã giảm giá', href: '/admin/coupons', badge: 0, icon: Ticket },
      ],
    },
    {
      groupId: 'system',
      groupLabel: 'Hệ thống',
      icon: Settings,
      items: [
        { id: 'announcements', label: 'Thông báo hệ thống', href: '/admin/announcements', badge: 0, icon: Bell },
        { id: 'settings', label: 'Cấu hình hệ thống', href: '/admin/settings', badge: 0, icon: Settings },
      ],
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50 text-gray-900 font-sans md:flex-row">
      <div className="sticky top-0 z-30 hidden h-dvh w-16 shrink-0 self-start md:block">
        <div className="group/rail absolute inset-y-0 left-0 flex h-full w-16 flex-col overflow-hidden bg-[#0F1B2B] transition-[width] duration-200 ease-out hover:w-[260px] hover:shadow-2xl">
          <div className="flex h-16 shrink-0 items-center gap-[9px] px-[18px]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 font-display text-base font-bold text-white">
              L
            </span>
            <div className="flex min-w-0 flex-col whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100">
              <span className="font-display text-[15px] font-bold text-white">LinguaLearn</span>
              <span className="text-[11px] text-slate-400">Quản trị viên</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <nav className="flex flex-col gap-1 px-2 py-4">
              {topLevelItems.map((item) => (
                <SidebarLink key={item.id} item={item} pathname={pathname} />
              ))}

              {sidebarGroups.map((group) => {
                const isGroupActive = group.items.some(
                  (item) => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)),
                );
                const isExpanded = isGroupActive || !collapsedGroups[group.groupId];
                const GroupIcon = group.icon;
                return (
                  <div key={group.groupId} className="mt-1.5 first:mt-0">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.groupId)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11.5px] font-bold uppercase tracking-wide text-slate-500 hover:text-slate-300"
                    >
                      <div className="flex items-center gap-3">
                        <GroupIcon className="h-5 w-5 shrink-0" />
                        <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100">{group.groupLabel}</span>
                      </div>
                      <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-0 transition-all duration-150 group-hover/rail:opacity-100 ${isExpanded ? '' : '-rotate-90'}`} strokeWidth={2} />
                    </button>
                    {isExpanded && (
                      <div className="ml-5 flex flex-col gap-1 border-l border-white/10 pl-2 opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100">
                        {group.items.map((item) => (
                          <SidebarLink key={item.id} item={item} pathname={pathname} isChild />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
          
          <Link href="/" className="flex items-center gap-3 whitespace-nowrap px-[22px] py-2 text-xs text-slate-400 no-underline hover:text-slate-300">
            <ChevronDown className="h-4 w-4 shrink-0 rotate-90" />
            <span className="opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100">Về trang học viên</span>
          </Link>
          
          <div className="mt-auto border-t border-white/10 pt-3">
            <div className="flex items-center gap-2.5 px-[18px]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 font-display text-[12.5px] font-bold text-white uppercase">
                {userInfo?.initials || 'A'}
              </span>
              <div className="flex min-w-0 flex-col whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100">
                <span className="truncate text-[12.5px] font-semibold text-white">{userInfo?.name || 'Đang tải...'}</span>
                <span className="text-[11px] text-slate-400">{userInfo?.role || 'Admin'}</span>
              </div>
            </div>
            <div className="whitespace-nowrap px-2 pb-2 opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100">
              <LogoutSidebarButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-5 md:p-[28px_32px] flex flex-col gap-[18px] md:gap-[22px]">
        {children}
      </main>
    </div>
  );
}

function SidebarLink({ item, pathname, isChild = false }: { item: SidebarItem; pathname: string; isChild?: boolean }) {
  const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.label}
      className={`flex items-center justify-between rounded-lg no-underline ${
        isChild ? 'px-3 py-2 text-[12.5px] font-medium' : 'px-3 py-2.5 text-[13.5px] font-semibold'
      } ${isActive ? 'bg-cyan-400/15 text-cyan-300' : isChild ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-300 hover:bg-slate-800'}`}
    >
      <div className="flex items-center gap-3">
        {!isChild && <Icon className="h-5 w-5 shrink-0" />}
        <span className={`whitespace-nowrap ${isChild ? '' : 'opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100'}`}>
          {item.label}
        </span>
      </div>
      {item.badge > 0 && (
        <span className={`flex min-w-[18px] h-[18px] shrink-0 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ${isChild ? '' : 'opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100'}`}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}
