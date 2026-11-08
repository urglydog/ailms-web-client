import { Suspense } from 'react';
import { StudentChrome } from '@/components/layout/StudentChrome';

/**
 * Layout dùng chung cho các trang cần đăng nhập (giỏ hàng, thanh toán, bài thi, tài liệu,
 * tiến độ, lớp học trực tuyến) — trước đây nhóm `(student)` không có layout riêng nên các trang
 * này không hiển thị Header/Footer của site, gây cảm giác "lạc trang". Trang xem bài học
 * (`/learn`) KHÔNG dùng layout này — xem `app/(learn)/layout.tsx` để biết lý do.
 */
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<main id="main-content" className="min-h-dvh">{children}</main>}>
      <StudentChrome>{children}</StudentChrome>
    </Suspense>
  );
}
