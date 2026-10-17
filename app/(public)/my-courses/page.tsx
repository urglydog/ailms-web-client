'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MyCoursesView } from '@/components/my-courses/MyCoursesView';
import { MyLearningTabs } from '@/components/course/MyLearningTabs';
import { getCurrentRole } from '@/lib/auth/token';

/**
 * "Khóa học của tôi" — bảng điều khiển học tập (spec mục 6, 17/10/2026): thống kê, khối Tiếp tục học, lọc theo
 * trạng thái, dạng xem danh sách/thẻ. Dữ liệu từ `GET /api/v1/enrollments/mine`; mọi lọc/sắp xếp làm phía
 * client (xem `MyCoursesView`). Chưa đăng nhập thì chuyển sang `/login`.
 */
export default function MyCoursesPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getCurrentRole()) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div>
      <div className="border-b border-line bg-surface">
        <div className="shell pb-0 pt-8">
          <MyLearningTabs active="courses" />
        </div>
      </div>
      <MyCoursesView />
    </div>
  );
}
