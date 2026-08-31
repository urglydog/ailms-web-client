'use client';

import Link from 'next/link';
import { useLiveSessionsForCourse } from '@/hooks/useLiveView';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * UC51 — điểm vào duy nhất để Guest/Student thấy và bấm vào buổi live của khóa học này, từ
 * trang chi tiết khóa học công khai. Không hiện gì nếu chưa có phiên LIVE/SCHEDULED nào — không
 * làm rối trang chi tiết khóa học bình thường (đa số khóa không có live đang diễn ra).
 */
export function CourseLiveBanner({ courseId }: { courseId: number }) {
  const { data: sessions } = useLiveSessionsForCourse(courseId);
  const liveNow = sessions?.find((s) => s.status === 'LIVE');
  const upcoming = sessions?.find((s) => s.status === 'SCHEDULED');
  const session = liveNow ?? upcoming;

  if (!session) return null;

  return (
    <Link
      href={`/live/${session.id}`}
      className="card flex items-center justify-between gap-3 border-red-200 bg-red-50 px-5 py-4 no-underline hover:border-red-300"
    >
      <div className="flex items-center gap-3">
        <span className={liveNow ? 'text-red-600' : 'text-ink-muted'} aria-hidden>
          {liveNow ? '●' : '🗓️'}
        </span>
        <div>
          <p className="m-0 font-display text-sm font-bold text-ink">
            {liveNow ? 'Đang live: ' : 'Sắp live: '}
            {session.title}
          </p>
          {!liveNow && session.scheduledAt && (
            <p className="m-0 text-xs text-ink-muted">Dự kiến {formatDateTime(session.scheduledAt)}</p>
          )}
        </div>
      </div>
      <span className="text-sm font-semibold text-accent">Xem ngay →</span>
    </Link>
  );
}
