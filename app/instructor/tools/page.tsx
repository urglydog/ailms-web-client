'use client';

import Link from 'next/link';
import { TagIcon, VideoIcon } from '@/components/instructor/SidebarIcons';

/** "Công cụ" (19/09/2026, mở rộng — giao diện tham khảo Udemy) — gộp các mục trước đây nằm rời
 * ở sidebar to (Kho Học Liệu & Đề Thi/Live/Mã giảm giá) thành 1 trang trung tâm dạng thẻ, đúng
 * cách Udemy tổ chức "Tools" (Video thử nghiệm/Thông tin thị trường/Tạo mã giảm giá hàng loạt/
 * Gộp khóa học). Icon SVG đơn sắc đơn giản — không dùng icon nhiều màu/hiệu ứng 3D.
 *
 * (23/09/2026) — bỏ thẻ "Kho Học Liệu & Đề Thi" khỏi đây: Materials Workspace giờ chỉ còn
 * đúng 1 nơi (route lồng trong Edit khoá học, tab "Học liệu & Quiz thi cử") — trước đây route
 * `/instructor/materials` đứng riêng ở đây tạo ra 2 chỗ cùng quản lý học liệu, gây rối luồng
 * điều hướng (đóng khung xem chi tiết ở route lồng còn bị đá nhầm sang route này). */
const TOOLS = [
  {
    href: '/instructor/live',
    icon: VideoIcon,
    title: 'Live',
    description: 'Tạo và quản lý các buổi dạy trực tuyến, xem lại thống kê buổi đã diễn ra.',
  },
  {
    href: '/instructor/coupons',
    icon: TagIcon,
    title: 'Mã giảm giá',
    description: 'Tạo mã giảm giá áp dụng cho một, nhiều, hoặc toàn bộ khóa học của bạn.',
  },
];

export default function InstructorToolsPage() {
  return (
    <>
      <div>
        <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Công cụ</h1>
        <p className="mt-1 text-sm text-gray-500">Các công cụ hỗ trợ quản lý và phát triển khóa học của bạn.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 no-underline shadow-sm transition-colors hover:border-cyan-300 hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <tool.icon className="h-5 w-5" />
            </span>
            <span className="font-display text-[15px] font-bold text-gray-900">{tool.title}</span>
            <span className="text-[12.5px] leading-relaxed text-gray-500">{tool.description}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
