'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { captureReferralFromUrl } from '@/lib/referral';

function ReferralCaptureInner({ courseId }: { courseId: number }) {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  useEffect(() => {
    captureReferralFromUrl(courseId, ref);
  }, [courseId, ref]);

  return null;
}

/**
 * Chia doanh thu 2 mức (20/09/2026) — component vô hình, chỉ đọc query `?ref=` (liên kết giới
 * thiệu riêng của Giảng viên) và lưu lại (xem `lib/referral.ts`). Tự bọc `<Suspense>` vì
 * `useSearchParams` yêu cầu vậy trong App Router — không phụ thuộc trang cha đã có sẵn boundary
 * hay chưa, cùng khuôn `app/(public)/courses/page.tsx`.
 */
export function ReferralCapture({ courseId }: { courseId: number }) {
  return (
    <Suspense fallback={null}>
      <ReferralCaptureInner courseId={courseId} />
    </Suspense>
  );
}
