'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus, Video } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LIVE_ROW_GRID, LiveRow } from '@/components/instructor/live/LiveRow';
import { EmptyState } from '@/components/instructor/ui/EmptyState';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMyLiveSessions } from '@/hooks/useLiveSessions';
import { ApiError } from '@/lib/api/client';

/** Danh sách buổi live của giảng viên: tiêu đề, khóa học, trạng thái (đang live nổi bật) và lối vào phòng. Chờ mount mới chọn
 * giữa "đang tải" và "trống" vì dữ liệu cần token (máy chủ không có). */
export default function InstructorLivePage() {
  const t = useTranslations('instructor.live');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { data: sessions, isLoading, error } = useMyLiveSessions();
  const loading = !mounted || isLoading;
  const list = sessions ?? [];

  return (
    <>
      <PageHeader
        title={t('title')}
        action={
          <Link
            href="/instructor/live/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-[13.5px] font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
          >
            <Plus size={16} aria-hidden />
            {t('create')}
          </Link>
        }
      />

      {error && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-white p-4 text-sm text-danger">
          {error instanceof ApiError ? error.message : t('loadError')}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <div className={`hidden border-b border-line bg-surface px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-wide text-ink-muted ${LIVE_ROW_GRID}`}>
          <span>{t('columns.title')}</span>
          <span>{t('columns.course')}</span>
          <span>{t('columns.status')}</span>
          <span />
        </div>

        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={Video} title={t('empty.title')} body={t('empty.body')} />
        ) : (
          <ul className="m-0 list-none p-0">
            {list.map((session) => (
              <LiveRow key={session.id} session={session} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
