'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { LogoutSidebarButton } from '@/components/auth/LogoutSidebarButton';
import { useModerationQueue } from '@/hooks/useCourses';
import { getAccessToken, getCurrentRole } from '@/lib/auth/token';

type SidebarItem = { id: string; label: string; href: string; badge: number };
type SidebarGroup = { groupId: string; groupLabel: string; items: SidebarItem[] };

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
    { id: 'overview', label: 'Tổng quan', href: '/admin', badge: 0 },
    { id: 'users', label: 'Quản lý người dùng', href: '/admin/users', badge: 0 },
  ];

  const sidebarGroups: SidebarGroup[] = [
    {
      groupId: 'content',
      groupLabel: 'Nội dung khóa học',
      items: [
        { id: 'moderation', label: 'Kiểm duyệt khóa học', href: '/admin/moderation', badge: pendingCoursesCount },
        { id: 'categories', label: 'Danh mục', href: '/admin/categories', badge: 0 },
        { id: 'reviews', label: 'Đánh giá', href: '/admin/reviews', badge: 0 },
      ],
    },
    {
      groupId: 'ai',
      groupLabel: 'AI & Tự động hoá',
      items: [
        { id: 'aianalytics', label: 'AI Analytics', href: '/admin/ai-analytics', badge: 0 },
        { id: 'aiqueue', label: 'Giám sát AI Queue', href: '/admin/ai-queue', badge: 0 },
        { id: 'voice-mappings', label: 'Giọng đọc lồng tiếng', href: '/admin/voice-mappings', badge: 0 },
        { id: 'tutor-security', label: 'Bảo mật AI Tutor', href: '/admin/tutor-security', badge: 0 },
      ],
    },
    {
      groupId: 'finance',
      groupLabel: 'Tài chính',
      items: [
        { id: 'transactions', label: 'Đối soát giao dịch', href: '/admin/transactions/payments', badge: 0 },
        { id: 'coupons', label: 'Mã giảm giá', href: '/admin/coupons', badge: 0 },
      ],
    },
    {
      groupId: 'system',
      groupLabel: 'Hệ thống',
      items: [
        { id: 'announcements', label: 'Thông báo hệ thống', href: '/admin/announcements', badge: 0 },
        { id: 'settings', label: 'Cấu hình hệ thống', href: '/admin/settings', badge: 0 },
      ],
    },
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
          {topLevelItems.map((item) => (
            <SidebarLink key={item.id} item={item} pathname={pathname} />
          ))}

          {sidebarGroups.map((group) => {
            const isGroupActive = group.items.some(
              (item) => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)),
            );
            // Nhóm chứa trang đang xem thì luôn mở, bất kể admin đã thu gọn trước đó —
            // không để admin "lạc mất" trang mình đang ở vì nhóm bị gập.
            const isExpanded = isGroupActive || !collapsedGroups[group.groupId];
            return (
              <div key={group.groupId} className="mt-1.5 first:mt-0">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.groupId)}
                  className="flex w-full items-center justify-between rounded-lg px-3.5 py-2 text-[11.5px] font-bold uppercase tracking-wide text-slate-500 hover:text-slate-300"
                >
                  <span>{group.groupLabel}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? '' : '-rotate-90'}`} strokeWidth={2} />
                </button>
                {isExpanded && (
                  <div className="flex flex-col gap-1">
                    {group.items.map((item) => (
                      <SidebarLink key={item.id} item={item} pathname={pathname} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        <Link href="/" className="px-2 text-xs text-slate-400 no-underline hover:text-slate-300">
          ← Về trang học viên
        </Link>
        
        <div className="mt-auto border-t border-white/10 pt-3">
          <div className="flex items-center gap-2.5 px-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 font-display text-[12.5px] font-bold text-white uppercase">
              {userInfo?.initials || 'A'}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[12.5px] font-semibold text-white">{userInfo?.name || 'Đang tải...'}</span>
              <span className="text-[11px] text-slate-400">{userInfo?.role || 'Admin'}</span>
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

function SidebarLink({ item, pathname }: { item: SidebarItem; pathname: string }) {
  const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
  return (
    <Link
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
}
