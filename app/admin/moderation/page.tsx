'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { CourseStatusBadge } from '@/components/course/CourseStatusBadge';
import { EmptyState } from '@/components/instructor/ui/EmptyState';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useModerationQueue } from '@/hooks/useCourses';
import { ApiError } from '@/lib/api/client';
import { formatMoney } from '@/lib/shop/money';
import type { CourseStatus } from '@/types/domain';

const STATUS_TABS: CourseStatus[] = ['PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];

/** Hàng đợi kiểm duyệt khóa học: lọc theo trạng thái; mỗi khóa mở trang chi tiết để duyệt hoặc từ chối. */
export default function AdminModerationPage() {
  const t = useTranslations('admin.moderation');
  const locale = useLocale();
  const [statusFilter, setStatusFilter] = useState<CourseStatus>('PENDING');
  const { data, isLoading, error } = useModerationQueue({ status: statusFilter });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const courses = data?.content ?? [];
  const loading = !mounted || isLoading;

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div role="group" aria-label={t('filtersAria')} className="flex flex-wrap gap-2">
        {STATUS_TABS.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={statusFilter === id}
            onClick={() => setStatusFilter(id)}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
              statusFilter === id ? 'bg-accent text-white' : 'border border-line bg-white text-ink-muted hover:border-accent hover:text-ink'
            }`}
          >
            {t(`tabs.${id}`)}
            {statusFilter === id && data ? ` (${data.totalElements.toLocaleString(locale)})` : ''}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-white p-4 text-sm text-danger">
          {error instanceof ApiError ? error.message : t('loadError')}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState icon={ShieldCheck} title={t('empty.title')} body={t(`empty.${statusFilter}`)} />
        ) : (
          <ul className="m-0 list-none p-0">
            {courses.map((course) => (
              <li key={course.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line-soft px-4 py-3 last:border-b-0 hover:bg-surface">
                <div
                  aria-hidden
                  className="h-11 w-[72px] shrink-0 rounded-md bg-tint bg-cover bg-center"
                  style={course.thumbnailUrl ? { backgroundImage: `url(${course.thumbnailUrl})` } : undefined}
                />
                <div className="min-w-0 flex-1 basis-48">
                  <div className="truncate text-[13.5px] font-semibold text-ink">{course.title}</div>
                  <div className="truncate text-xs text-ink-muted">
                    {course.categoryName} · {t('lessons', { count: course.totalLessons })} · {course.isFree ? t('free') : formatMoney(course.price, locale)}
                  </div>
                </div>
                <span className="hidden text-xs text-ink-muted sm:block">{new Date(course.createdAt).toLocaleDateString(locale)}</span>
                <CourseStatusBadge status={course.status} />
                <Link
                  href={`/admin/moderation/${course.id}`}
                  aria-label={t(course.status === 'PENDING' ? 'reviewAria' : 'viewAria', { title: course.title })}
                  className={`shrink-0 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold no-underline ${
                    course.status === 'PENDING' ? 'bg-accent text-white hover:bg-accent-dark hover:text-white' : 'bg-tint text-accent-dark hover:bg-line'
                  }`}
                >
                  {t(course.status === 'PENDING' ? 'review' : 'view')}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
