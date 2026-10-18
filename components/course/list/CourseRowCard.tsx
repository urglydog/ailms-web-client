'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import type { CourseSummary } from '@/types/domain';

/** Thẻ khóa học dạng hàng ngang cho kho khóa học ở chế độ danh sách: ảnh bìa bên trái, thông tin ở giữa, giá bên phải. */
export function CourseRowCard({ course }: { course: CourseSummary }) {
  const t = useTranslations('courseList');
  const locale = useLocale();
  const money = (n: number) => `${n.toLocaleString(locale)}đ`;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="card-interactive group flex flex-col overflow-hidden no-underline hover:no-underline sm:flex-row"
    >
      <div
        className="relative aspect-video shrink-0 overflow-hidden sm:aspect-auto sm:w-56"
        style={
          course.thumbnailUrl
            ? undefined
            : { background: `linear-gradient(135deg, ${course.coverColorA}, ${course.coverColorB})` }
        }
      >
        {course.thumbnailUrl && (
          <Image
            src={course.thumbnailUrl}
            alt=""
            fill
            sizes="(min-width: 640px) 224px, 100vw"
            className="object-cover transition-transform duration-[400ms] ease-soft group-hover:scale-105"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h3 className="m-0 line-clamp-2 font-display text-[15px] font-semibold leading-snug text-ink">{course.title}</h3>
          <p className="m-0 mt-1 text-xs text-ink-muted">
            {course.instructorName} · {t('card.lessons', { count: course.totalLessons })}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StarRating rating={course.avgRating} reviewCount={course.reviewCount} />
            <span className="rounded-full bg-tint px-2 py-0.5 text-[11px] font-semibold text-accent-dark">
              {t(`level.${course.level}`)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          {course.isFree ? (
            <Badge tone="success">{t('card.free')}</Badge>
          ) : (
            <>
              <span className="font-display text-lg font-bold text-ink">{money(course.finalPrice)}</span>
              {course.discountPercent ? (
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="text-ink-muted line-through">{money(course.price)}</span>
                  <span className="rounded bg-danger/10 px-1.5 py-0.5 font-bold text-danger">-{course.discountPercent}%</span>
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
