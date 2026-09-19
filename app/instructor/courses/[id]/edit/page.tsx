'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** (19/09/2026) — `/edit` tách thành nhiều trang con kiểu Udemy (xem `EditCourseLayout.tsx`);
 * giữ URL cũ này chuyển hướng sang trang mặc định để không hỏng đường link đã lưu/bookmark. */
export default function EditCourseRedirectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    router.replace(`/instructor/courses/${params.id}/edit/curriculum`);
  }, [router, params.id]);

  return <div className="p-10 text-center text-sm text-gray-500">Đang chuyển hướng...</div>;
}
