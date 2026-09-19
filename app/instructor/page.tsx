'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** (19/09/2026) — bỏ trang "Tổng quan" độc lập vì trùng thông tin với tab Tổng quan bên trong
 * "Hiệu suất" (`/instructor/revenue`) và bảng khóa học ở `/instructor/courses`. Giữ route
 * `/instructor` để không hỏng đường link cũ (đăng nhập, bookmark) — chuyển hướng sang trang
 * "Khóa học của tôi", mục đầu tiên của sidebar mới. */
export default function InstructorRootRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/instructor/courses');
  }, [router]);

  return <div className="p-10 text-center text-sm text-gray-500">Đang chuyển hướng...</div>;
}
