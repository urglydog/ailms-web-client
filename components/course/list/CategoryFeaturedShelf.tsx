'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { CourseCard } from '@/components/course/CourseCard';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { publicCoursesApi } from '@/lib/api/publicCourses';
import { pickTrending } from '@/lib/home/trending';

/**
 * Kệ "Được đề xuất" ở ĐẦU TRANG DANH MỤC (placement `CATEGORY_FEATURED`, Giai đoạn E): chỉ hiện khi đang lọc theo 1 danh mục và
 * không gõ từ khóa tìm kiếm. Lỗi/rỗng thì không vẽ gì (không ảnh hưởng danh sách khóa học bên dưới). Tiêu đề luôn ghi rõ "Được đề xuất"
 * để học viên biết đây không phải xếp hạng thuần theo đánh giá.
 */
export function CategoryFeaturedShelf({ categorySlug }: { categorySlug: string }) {
  const t = useTranslations('home.shelves.featured');
  const { data: enrollments } = useMyEnrollments();
  const { data } = useQuery({
    queryKey: ['courses', 'featured', 'CATEGORY_FEATURED', categorySlug],
    queryFn: () => publicCoursesApi.featured('CATEGORY_FEATURED', 4, categorySlug),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const ownedIds = enrollments ? new Set(enrollments.map((e) => e.courseId)) : null;
  const visible = pickTrending(data ?? [], ownedIds);
  if (visible.length === 0) return null;

  return (
    <section className="mb-6 rounded-xl border border-line bg-tint p-4">
      <h2 className="m-0 font-display text-lg font-semibold text-ink">{t('title')}</h2>
      <p className="m-0 mb-3 mt-0.5 text-sm text-ink-muted">{t('subtitle')}</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
