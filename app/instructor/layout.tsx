'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogoutSidebarButton } from '@/components/auth/LogoutSidebarButton';
import { UploadTray } from '@/components/instructor/UploadTray';
import { InstructorChat } from '@/components/chat/InstructorChat';
import { ArrowLeftIcon, BarChartIcon, EyeIcon, MessageCircleIcon, PlayCircleIcon, WrenchIcon } from '@/components/instructor/SidebarIcons';
import { getCurrentRole } from '@/lib/auth/token';
import { useCurrentUser } from '@/hooks/useCurrentUser';

/** (19/09/2026, redesign — giao diện tham khảo Udemy) — sidebar hẹp chỉ hiện icon theo mặc
 * định, rê chuột vào thì mở rộng hiện thêm nhãn chữ (đè lên nội dung, không đẩy layout dịch
 * chỗ) — thay hẳn nút "thu gọn" thủ công lưu localStorage ở bản trước, vì hành vi hover tự
 * động đã cho đúng cùng lợi ích (nhường chỗ ngang) mà không cần nhớ trạng thái qua lại.
 *
 * "Kho Học Liệu & Đề Thi"/"Live"/"Mã giảm giá" dời vào trang "Công cụ" gộp chung (xem
 * `app/instructor/tools/page.tsx`). Bỏ hẳn mục "Tổng quan" và "Học viên" (19/09/2026) — trùng
 * thông tin với tab Tổng quan/Sinh viên đã có sẵn bên trong "Hiệu suất" (xem
 * `app/instructor/revenue/layout.tsx`). Thêm "Giao tiếp" (19/09/2026, tính năng mới) — Hỏi
 * đáp/Tin nhắn/Bài tập/Thông báo, xem `app/instructor/communication/`. */
const SIDEBAR_ITEMS = [
  { id: 'courses', label: 'Khóa học của tôi', href: '/instructor/courses', icon: PlayCircleIcon },
  { id: 'communication', label: 'Giao tiếp', href: '/instructor/communication', icon: MessageCircleIcon },
  { id: 'revenue', label: 'Hiệu suất', href: '/instructor/revenue', icon: BarChartIcon },
  // UC-ANTICHEAT (25/09/2026) — xem lại bằng chứng thi cử (video + cảnh báo AI). Xứng đáng 1 mục
  // riêng ở sidebar (khác các trang đã gộp vào "Công cụ") vì đây là luồng theo dõi xuyên khoá
  // học, không thuộc về quản lý 1 khoá cụ thể.
  { id: 'proctoring', label: 'Giám sát thi', href: '/instructor/proctoring', icon: EyeIcon },
  { id: 'tools', label: 'Công cụ', href: '/instructor/tools', icon: WrenchIcon },
];

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // (15/09/2026) — sidebar trước đây gắn cứng "Trần Thanh Hà"/"TH", không đổi theo tài khoản
  // đang đăng nhập thật (lộ rõ khi 1 học viên vừa "Trở thành Giảng viên" vào đây vẫn thấy tên
  // giảng viên khác). Đọc từ `useCurrentUser()` — cùng nguồn dữ liệu Header đang dùng.
  const { data: currentUser } = useCurrentUser();
  const initials = currentUser?.fullName
    ? currentUser.fullName.split(' ').filter(Boolean).slice(-2).map((w) => w.charAt(0).toUpperCase()).join('')
    : 'GV';

  useEffect(() => {
    const role = getCurrentRole();
    if (!role) {
      router.replace('/login');
    }
  }, [router]);

  // (19/09/2026) — "Tạo khóa học mới" VÀ trang chỉnh sửa khóa học (`/edit/*`) đều là màn hình
  // TOÀN TRANG riêng biệt (giao diện tham khảo Udemy: không có sidebar quản lý to bên trái,
  // `EditCourseLayout` tự có thanh trên + mini-nav riêng của nó) — bỏ qua toàn bộ khung sidebar/
  // UploadTray/InstructorChat của layout này cho 2 nhóm route đó, chỉ bấm "Quay lại các khóa
  // học" mới trở về trang quản lý có sidebar.
  if (pathname === '/instructor/courses/new' || /^\/instructor\/courses\/\d+\/edit(\/|$)/.test(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh bg-gray-50 text-gray-900 font-sans">
      {/* Chừa đúng 64px trong luồng layout (nội dung chính không bị đè) — bảng hiện vật lý nằm
          `absolute` bên trong, mở rộng đè lên khi hover, không làm nội dung dịch chuyển. */}
      <div className="sticky top-0 z-30 h-dvh w-16 shrink-0 self-start">
        <div className="group/rail absolute inset-y-0 left-0 flex h-full w-16 flex-col overflow-hidden bg-[#0F1B2B] transition-[width] duration-200 ease-out hover:w-64 hover:shadow-2xl">
          <div className="flex h-16 shrink-0 items-center gap-[9px] px-[18px]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 font-display text-base font-bold text-white">
              L
            </span>
            <div className="flex min-w-0 flex-col whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100">
              <span className="font-display text-[15px] font-bold text-white">LinguaLearn</span>
              <span className="text-[11px] text-slate-400">Giảng viên</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1 px-2 py-4">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    if (pathname === item.href) {
                      e.preventDefault();
                      router.push(item.href); // force remove query params
                    }
                  }}
                  title={item.label}
                  className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-[13.5px] font-semibold no-underline ${
                    isActive ? 'bg-accent/10 text-accent' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <Link
            href="/"
            title="Về trang học viên"
            className="flex items-center gap-3 whitespace-nowrap px-[22px] py-2 text-xs text-slate-400 no-underline hover:text-slate-300"
          >
            <ArrowLeftIcon className="h-4 w-4 shrink-0" />
            <span className="opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100">Về trang học viên</span>
          </Link>

          <div className="mt-auto border-t border-white/10 pt-3">
            <div className="flex items-center gap-2.5 px-[18px]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cyan-600 font-display text-[12.5px] font-bold text-white uppercase">
                {currentUser?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </span>
              <div className="flex min-w-0 flex-col whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100">
                <span className="truncate text-[12.5px] font-semibold text-white">{currentUser?.fullName || 'Đang tải...'}</span>
                <span className="text-[11px] text-slate-400">Giảng viên</span>
              </div>
            </div>
            <div className="whitespace-nowrap px-2 pb-2 opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100">
              <LogoutSidebarButton />
            </div>
          </div>
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
