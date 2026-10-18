'use client';

import { AlertCircle, BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { StatusCounts } from '@/lib/instructor/courseList';

/** Bốn thẻ chỉ số ở đầu trang Khóa học của tôi: tổng, đã xuất bản, chờ duyệt, cần xử lý. */
export function CourseStats({ counts }: { counts: StatusCounts }) {
  const t = useTranslations('instructor.courses.stats');
  const tiles = [
    { key: 'total', value: counts.ALL, Icon: BookOpen, tone: 'bg-tint text-accent-dark' },
    { key: 'published', value: counts.PUBLISHED, Icon: CheckCircle2, tone: 'bg-success-tint text-success-ink' },
    { key: 'pending', value: counts.PENDING, Icon: Clock, tone: 'bg-highlight/30 text-ink' },
    { key: 'attention', value: counts.attention, Icon: AlertCircle, tone: counts.attention > 0 ? 'bg-danger/10 text-danger' : 'bg-surface text-ink-muted' },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map(({ key, value, Icon, tone }) => (
        <div key={key} className="flex items-center gap-3 rounded-xl border border-line bg-white p-4">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
            <Icon size={20} aria-hidden />
          </span>
          <div>
            <div className="font-display text-2xl font-bold leading-none text-ink">{value}</div>
            <div className="mt-1 text-xs text-ink-muted">{t(key)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
