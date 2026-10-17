'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { CourseCard } from '@/components/course/CourseCard';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { useReveal } from '@/hooks/useReveal';
import { pickTrending } from '@/lib/home/trending';
import type { CourseSummary } from '@/types/domain';

interface CourseShelfProps {
  title: string;
  subtitle?: string;
  href: string;
  courses: CourseSummary[];
  tone?: 'plain' | 'tint';
}

/** Một hàng khóa học trên trang chủ: tiêu đề, mô tả ngắn, "Xem tất cả" và tối đa 4 thẻ (bỏ khóa đã sở hữu).
 * Không có khóa nào để hiện thì không vẽ gì, để trang không có hàng trống. */
export function CourseShelf({ title, subtitle, href, courses, tone = 'plain' }: CourseShelfProps) {
  const t = useTranslations('home.trending');
  const { data: enrollments } = useMyEnrollments();
  const [ref, shown] = useReveal<HTMLDivElement>();

  const ownedIds = enrollments ? new Set(enrollments.map((e) => e.courseId)) : null;
  const visible = pickTrending(courses, ownedIds);
  if (visible.length === 0) return null;

  return (
    <section className={tone === 'tint' ? 'bg-surface' : 'bg-surface-raised'}>
      <div className="shell py-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="m-0 font-display text-lg font-semibold text-ink">{title}</h2>
            {subtitle && <p className="m-0 mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
          </div>
          <Link href={href} className="text-sm font-semibold text-accent-dark no-underline hover:underline">
            {t('viewAll')} →
          </Link>
        </div>
        <div ref={ref} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((course, i) => (
            <div key={course.id} className={`reveal ${shown ? 'is-in' : ''}`} style={{ '--i': i } as CSSProperties}>
              <CourseCard course={course} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
