'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { key: 'overview', label: 'Tổng quan', href: '/instructor/revenue' },
  { key: 'revenue', label: 'Doanh thu', href: '/instructor/revenue/list' },
  { key: 'revenue-summary', label: 'Báo cáo doanh thu', href: '/instructor/revenue/summary' },
  { key: 'students', label: 'Sinh viên', href: '/instructor/revenue/students' },
  { key: 'reviews', label: 'Đánh giá', href: '/instructor/revenue/reviews' },
  { key: 'hard-questions', label: 'Câu hỏi khó', href: '/instructor/revenue/hard-questions' },
  { key: 'retention', label: 'Giữ chân', href: '/instructor/revenue/retention' },
];

/** "Hiệu suất" — giao diện tham khảo Udemy "Performance" (19/09/2026, xây mới hoàn toàn — trước
 * đây chỉ là placeholder "Coming Soon"). Mini-sidebar riêng của khu vực này, cùng khuôn
 * `EditCourseLayout.tsx` đã dựng cho trang chỉnh sửa khóa học. */
export default function RevenueLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    // (26/09/2026, sửa lỗi) — cột nav 200px cố định không co giãn dưới `md`, chừa quá ít chỗ cho
    // nội dung. Dưới `md`: xếp dọc, nav thành 1 thanh tab cuộn ngang; từ `md:` giữ nguyên 2 cột.
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr] md:gap-6">
      <nav className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold no-underline transition-colors ${
                isActive ? 'bg-cyan-50 text-cyan-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );
}
