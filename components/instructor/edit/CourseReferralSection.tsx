'use client';

import { useState } from 'react';
import { ShareCourseDialog } from '@/components/share/ShareCourseDialog';
import { useRevenueShare } from '@/hooks/useRevenueShare';
import type { CourseEditDetail } from '@/types/domain';

/**
 * Chia doanh thu 2 mức (20/09/2026, tính năng mới) — trong panel Cài đặt của
 * `EditCourseLayout.tsx`, cùng khuôn `CourseVisibilitySection.tsx`.
 *
 * Học viên tự tìm thấy khóa qua tìm kiếm/duyệt danh mục trên nền tảng → Giảng viên hưởng tỷ lệ
 * organic. Học viên mua qua ĐÚNG liên kết này (Giảng viên tự đăng lên Facebook, YouTube cá
 * nhân...) → Giảng viên hưởng tỷ lệ referral cao hơn — xem {@code PaymentService.resolveRevenueSource}
 * phía backend. (11/11/2026) Hai tỷ lệ là cấu hình admin, đọc từ `GET /instructor/revenue-share`
 * thay vì hard-code 37%/97%.
 */
export function CourseReferralSection({ course }: { course: CourseEditDetail }) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { data: share } = useRevenueShare();
  const referralPct = share ? `${share.referralInstructorPct}%` : '—';
  const organicPct = share ? `${share.organicInstructorPct}%` : '—';
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
    <div className="flex flex-col gap-3 border-b border-line-soft p-6">
      <h3 className="m-0 text-[14px] font-bold text-ink">Liên kết giới thiệu</h3>
      <p className="text-[12px] text-ink-muted">
        Chia sẻ đúng liên kết này trên kênh của bạn (Facebook, YouTube...) — học viên mua qua
        đây, bạn hưởng <span className="font-bold text-ink">{referralPct}</span> doanh thu thay vì{' '}
        {organicPct} khi học viên tự tìm thấy khóa học qua tìm kiếm trên nền tảng.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={referralUrl}
          onFocus={(e) => e.target.select()}
          className="flex-1 truncate rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-white hover:bg-accent-dark"
        >
          {copied ? 'Đã sao chép ✓' : 'Sao chép'}
        </button>
        <button
          type="button"
          onClick={() => setSharing(true)}
          title="Chia sẻ lên mạng xã hội hoặc qua ứng dụng trên thiết bị"
          className="shrink-0 rounded-lg border border-line px-4 py-2 text-[13px] font-bold text-accent-dark hover:bg-tint"
        >
          Chia sẻ
        </button>
      </div>
      {sharing && (
        <ShareCourseDialog open onClose={() => setSharing(false)} title={course.title} slug={course.slug} referralCode={course.referralCode} />
      )}
    </div>
  );
}
