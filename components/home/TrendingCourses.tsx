'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { CourseCard } from '@/components/course/CourseCard';
import { Chip } from '@/components/ui/Chip';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCategories } from '@/hooks/useCategories';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { useReveal } from '@/hooks/useReveal';
import { useTrendingCourses } from '@/hooks/useTrendingCourses';
import { TRENDING_LIMIT, pickTrending } from '@/lib/home/trending';
import type { CourseSummary } from '@/types/domain';

/** Hàng "Đang thịnh hành" (spec mục 4): chip lọc danh mục + lưới 4 thẻ, xuất hiện lần lượt khi cuộn tới. */
export function TrendingCourses({ initialCourses }: { initialCourses: CourseSummary[] }) {
  const t = useTranslations('home.trending');
  const [slug, setSlug] = useState<string | null>(null);
  const { data: categories } = useCategories();
  const { data: courses, isLoading } = useTrendingCourses(slug, initialCourses);
  const { data: enrollments } = useMyEnrollments();
  const [ref, shown] = useReveal<HTMLDivElement>();

  const ownedIds = enrollments ? new Set(enrollments.map((e) => e.courseId)) : null;
  const visible = pickTrending(courses ?? [], ownedIds);

  return (
    <section className="bg-surface-raised">
      <div className="shell py-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 font-display text-lg font-semibold text-ink">{t('title')}</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip active={slug === null} onClick={() => setSlug(null)}>
              {t('all')}
            </Chip>
            {(categories ?? []).map((c) => (
              <Chip key={c.id} active={slug === c.slug} onClick={() => setSlug(c.slug)}>
                {c.name}
              </Chip>
            ))}
            <Link href="/courses" className="ml-2 text-sm font-semibold text-accent-dark no-underline hover:underline">
              {t('viewAll')} →
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: TRENDING_LIMIT }, (_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">{t('empty')}</p>
        ) : (
          <div ref={ref} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((course, i) => (
              <div
                key={course.id}
                className={`reveal ${shown ? 'is-in' : ''}`}
                style={{ '--i': i } as CSSProperties}
              >
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
