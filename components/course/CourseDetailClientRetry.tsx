'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { CourseDetailView } from '@/components/course/CourseDetailView';
import { ApiError } from '@/lib/api/client';
import { publicCoursesApi } from '@/lib/api/publicCourses';
import type { CourseDetail } from '@/types/domain';

/**
 * (19/09/2026, tính năng mới) — fetch lại phía CLIENT khi trang server-render 404. Chỉ cần thiết
 * cho khóa "Riêng tư (Chỉ dành cho người được mời)": Server Component không đọc được JWT lưu
 * trong `localStorage`, nên lần fetch đầu (ẩn danh) LUÔN bị BE từ chối như khách lạ — kể cả
 * chính người được mời hay Giảng viên sở hữu khóa. Thử lại ở đây với `api.get` phía trình duyệt
 * (tự đính token thật, xem `lib/api/client.ts`) mới biết đúng danh tính người xem.
 *
 * Khóa Công khai/Riêng tư mật khẩu KHÔNG bao giờ rơi vào nhánh này (server fetch ẩn danh đã đủ
 * điều kiện xem) — chỉ khóa "Riêng tư mời" mới có thể 404 ở server rồi thành công ở đây.
 */
export function CourseDetailClientRetry({ slug }: { slug: string }) {
  const [state, setState] = useState<{ status: 'loading' } | { status: 'ok'; course: CourseDetail } | { status: 'denied' }>(
    { status: 'loading' },
  );

  useEffect(() => {
    let cancelled = false;
    publicCoursesApi
      .getBySlug(slug)
      .then((course) => {
        if (!cancelled) setState({ status: 'ok', course });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setState({ status: 'denied' });
          return;
        }
        setState({ status: 'denied' });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.status === 'loading') {
    return <div className="p-16 text-center text-sm text-ink-muted">Đang tải khóa học...</div>;
  }
  if (state.status === 'denied') {
    notFound();
  }
  return <CourseDetailView course={state.course} />;
}
