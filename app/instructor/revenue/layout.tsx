'use client';

import { usePathname } from 'next/navigation';
import { PerformanceTabs } from '@/components/instructor/performance/PerformanceTabs';

/** "Hiệu suất" — thanh tab ngang ở trên (Tổng quan, Doanh thu, Sinh viên, Đánh giá, Câu hỏi khó, Giữ chân), nội dung từng
 * mục ở dưới. Trước đây là mini-sidebar dọc; chuyển sang tab ngang để nhường chiều ngang cho bảng và biểu đồ.
 * (29/09/2026) "Tổng quan" và "Doanh thu" là 2 tab riêng: Tổng quan là dashboard tóm tắt, Doanh thu là bảng giao dịch có
 * khoảng ngày tự chọn. */
export default function RevenueLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-5">
      <PerformanceTabs pathname={pathname} />
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );
}
