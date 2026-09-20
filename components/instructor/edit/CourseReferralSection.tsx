'use client';

import { useState } from 'react';
import type { CourseEditDetail } from '@/types/domain';

/**
 * Chia doanh thu 2 mức (20/09/2026, tính năng mới) — trong panel Cài đặt của
 * `EditCourseLayout.tsx`, cùng khuôn `CourseVisibilitySection.tsx`.
 *
 * Học viên tự tìm thấy khóa qua tìm kiếm/duyệt danh mục trên nền tảng → Giảng viên hưởng 37%,
 * nền tảng giữ 63%. Học viên mua qua ĐÚNG liên kết này (Giảng viên tự đăng lên Facebook,
 * YouTube cá nhân...) → Giảng viên hưởng 97%, nền tảng chỉ giữ 3% — xem
 * {@code PaymentService.resolveRevenueSource} phía backend.
 */
export function CourseReferralSection({ course }: { course: CourseEditDetail }) {
  const [copied, setCopied] = useState(false);
  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/courses/${course.slug}?ref=${course.referralCode}`
    : `/courses/${course.slug}?ref=${course.referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // best-effort — trình duyệt/context không hỗ trợ Clipboard API thì thôi
    }
  };

  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 p-6">
      <h3 className="m-0 text-[14px] font-bold text-gray-900">Liên kết giới thiệu</h3>
      <p className="text-[12px] text-gray-500">
        Chia sẻ đúng liên kết này trên kênh của bạn (Facebook, YouTube...) — học viên mua qua
        đây, bạn hưởng <span className="font-bold text-gray-700">97%</span> doanh thu thay vì
        37% khi học viên tự tìm thấy khóa học qua tìm kiếm trên nền tảng.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={referralUrl}
          onFocus={(e) => e.target.select()}
          className="flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[12.5px] text-gray-700"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-lg bg-cyan-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-cyan-700"
        >
          {copied ? 'Đã sao chép ✓' : 'Sao chép'}
        </button>
      </div>
    </div>
  );
}
