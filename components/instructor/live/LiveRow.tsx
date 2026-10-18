'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { LiveSession, LiveSessionStatus } from '@/types/domain';

const STATUS_CLASS: Record<LiveSessionStatus, string> = {
  SCHEDULED: 'border border-highlight bg-white text-ink',
  LIVE: 'bg-danger text-white',
  ENDED: 'bg-line-soft text-ink-muted',
};

export const LIVE_ROW_GRID = 'sm:grid sm:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_120px_150px] sm:items-center sm:gap-3';

/** Một buổi live trong danh sách của giảng viên: tiêu đề, khóa học, trạng thái (đang live thì nổi bật) và lối vào phòng hoặc xem chi tiết. */
export function LiveRow({ session }: { session: Pick<LiveSession, 'id' | 'title' | 'courseTitle' | 'status'> }) {
  const t = useTranslations('instructor.live');
  const live = session.status === 'LIVE';

  return (
    <li className={`flex flex-col gap-2 border-b border-line-soft px-4 py-3 last:border-b-0 ${LIVE_ROW_GRID}`}>
      <span className="truncate text-[13.5px] font-semibold text-ink">{session.title}</span>
      <span className="truncate text-[13px] text-ink-muted">{session.courseTitle}</span>
      <span className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASS[session.status]}`}>
        {live && <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
        {t(`status.${session.status}`)}
      </span>
      <div className="sm:text-right">
        <Link
          href={`/instructor/live/${session.id}`}
          className={`inline-flex rounded-full px-3 py-1 text-[12px] font-bold no-underline ${
            live ? 'bg-accent text-white hover:bg-accent-dark hover:text-white' : 'text-accent-dark hover:underline'
          }`}
        >
          {live ? t('enter') : t('details')} →
        </Link>
      </div>
    </li>
  );
}
