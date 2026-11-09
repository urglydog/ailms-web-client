'use client';

import { useTranslations } from 'next-intl';
import { CourseCard } from '@/components/course/CourseCard';
import { useTrendingCourses } from '@/hooks/useTrendingCourses';
import { pickTrending } from '@/lib/home/trending';

/** Gợi ý khóa học chưa sở hữu, hiện khi chưa có khóa nào hoặc đã học xong hết (spec mục 6). */
export function NextSuggestions({
  ownedIds,
  titleKey,
}: {
  ownedIds: ReadonlySet<number>;
  titleKey: 'title' | 'trending';
}) {
  const t = useTranslations('myCourses.suggestions');
  const { data } = useTrendingCourses(null);
  const courses = pickTrending(data ?? [], ownedIds, 3);
  if (courses.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="m-0 mb-3 font-display text-base font-semibold text-ink">{t(titleKey)}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
