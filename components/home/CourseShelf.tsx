'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CourseCard } from '@/components/course/CourseCard';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { prefersReducedMotion } from '@/lib/motion/reducedMotion';
import { pickTrending } from '@/lib/home/trending';
import type { CourseSummary } from '@/types/domain';

/** Số thẻ tối đa trên một kệ (cuộn ngang bằng mũi tên). */
export const SHELF_LIMIT = 12;

interface CourseShelfProps {
  title: string;
  subtitle?: string;
  href: string;
  courses: CourseSummary[];
  tone?: 'plain' | 'tint';
}

/**
 * Một kệ khóa học trên trang chủ (UDEMY_LAYOUT_ANALYSIS mục 2): tiêu đề + mũi tên trái/phải (kệ ngắn thì "Xem tất cả"), hàng thẻ cuộn ngang
 * có mũi tên trái/phải (desktop), vuốt trên mobile. Bỏ khóa đã sở hữu; không có khóa nào thì không vẽ gì.
 */
export function CourseShelf({ title, subtitle, href, courses, tone = 'plain' }: CourseShelfProps) {
  const t = useTranslations('home.trending');
  const tShelf = useTranslations('home.shelves');
  const { data: enrollments } = useMyEnrollments();
  const trackRef = useRef<HTMLUListElement>(null);

  const ownedIds = enrollments ? new Set(enrollments.map((e) => e.courseId)) : null;
  const visible = pickTrending(courses, ownedIds, SHELF_LIMIT);
  if (visible.length === 0) return null;

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const arrow =
    'hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-surface-raised text-ink transition-colors hover:border-accent md:flex';

  return (
    <section className={tone === 'tint' ? 'bg-surface' : 'bg-surface-raised'} aria-label={title}>
      <div className="shell section-block">
        <div className="section-head">
          <div>
            <h2 className="section-title">{title}</h2>
            {subtitle && <p className="m-0 mt-1 text-sm text-ink-muted">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {/* Có mũi tên cuộn thì không cần thêm "Xem tất cả" (phản hồi 26/11/2026); kệ ngắn không cuộn mới hiện liên kết. */}
            {visible.length > 4 ? (
              <>
                <button type="button" onClick={() => scroll(-1)} aria-label={tShelf('prev')} className={arrow}>
                  <ChevronLeft size={18} aria-hidden />
                </button>
                <button type="button" onClick={() => scroll(1)} aria-label={tShelf('next')} className={arrow}>
                  <ChevronRight size={18} aria-hidden />
                </button>
              </>
            ) : (
              <Link href={href} className="text-sm font-semibold text-accent-dark no-underline hover:underline">
                {t('viewAll')} →
              </Link>
            )}
          </div>
        </div>
        <ul
          ref={trackRef}
          className="-mx-4 m-0 flex list-none snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] md:mx-0 md:px-0 md:scroll-px-0"
        >
          {visible.map((course) => (
            <li
              key={course.id}
              data-testid="shelf-item"
              className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3.75rem)/4)]"
            >
              <CourseCard course={course} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
