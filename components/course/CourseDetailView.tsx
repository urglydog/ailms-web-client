'use client';

import { Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ChapterAccordion } from '@/components/course/ChapterAccordion';
import { CoursePreview } from '@/components/course/CoursePreview';
import { EnrollButton } from '@/components/course/EnrollButton';
import { ReferralCapture } from '@/components/course/ReferralCapture';
import { ReviewsSection } from '@/components/course/ReviewsSection';
import { CourseDubbingPanel } from '@/components/course/detail/CourseDubbingPanel';
import { CourseHero } from '@/components/course/detail/CourseHero';
import { RelatedCourses } from '@/components/course/detail/RelatedCourses';
import { BundleUpsellWidget } from '@/components/bundles/BundleUpsellWidget';
import { CourseLiveBanner } from '@/components/live/CourseLiveBanner';
import type { CourseDetail } from '@/types/domain';

/**
 * Thân trang chi tiết khóa học (19/09/2026, tách ra từ `page.tsx`) — dùng chung cho CẢ 2 đường
 * lấy dữ liệu: fetch phía server (SEO, trường hợp thường gặp — khóa Công khai/Riêng tư mật
 * khẩu) VÀ fetch lại phía client với JWT thật (`CourseDetailClientRetry.tsx` — khóa "Riêng tư
 * mời" cần biết CHÍNH XÁC ai đang xem để BE quyết định cho/không cho xem, mà Server Component
 * không đọc được JWT lưu trong `localStorage` của trình duyệt).
 *
 * Bố cục (Kế hoạch giao diện học viên): hero sáng, cột nội dung bên trái, thẻ mua/đăng ký dính khi cuộn
 * bên phải (trên điện thoại thẻ này đứng đầu), cuối trang là hàng "Khóa học liên quan". Khóa có phí là
 * "Mua khóa học", khóa miễn phí là "Đăng ký" — không có khái niệm "Ghi danh" ở giao diện.
 */
export function CourseDetailView({ course }: { course: CourseDetail }) {
  const t = useTranslations('courseDetail');
  const locale = useLocale();
  const totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  const allLessons = course.chapters.flatMap((ch) => ch.lessons);
  const previewLessons = allLessons.filter((lesson) => lesson.isPreview);
  const firstLesson = allLessons[0] ?? null;
  const money = (n: number) => `${n.toLocaleString(locale)}đ`;

  return (
    <div>
      <ReferralCapture courseId={course.id} />
      <CourseHero course={course} />

      <div className="shell py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* ── Cột nội dung ── */}
          <div className="flex min-w-0 flex-col gap-8">
            <CourseLiveBanner courseId={course.id} />
            <CourseDubbingPanel languages={course.dubbedLanguages} />

            <section>
              <h2 className="mb-4 font-display text-xl font-bold text-ink">
                {t('content.title')}
                <span className="ml-2 text-sm font-normal text-ink-muted">
                  {t('content.summary', { chapters: course.chapters.length, lessons: totalLessons })}
                </span>
              </h2>
              <ChapterAccordion chapters={course.chapters} enrolled={course.enrolled} />
            </section>

            <section>
              <h2 className="mb-4 font-display text-xl font-bold text-ink">{t('reviews')}</h2>
              <ReviewsSection courseId={course.id} />
            </section>
          </div>

          {/* ── Thẻ mua / đăng ký (dính khi cuộn; trên điện thoại đứng đầu) ── */}
          <aside className="order-first lg:order-last lg:sticky lg:top-24 lg:self-start">
            <div className="card overflow-hidden">
              <CoursePreview
                thumbnailUrl={course.thumbnailUrl}
                courseTitle={course.title}
                previewLessons={previewLessons}
              />

              <div className="flex flex-col gap-4 p-6">
                {course.isFree ? (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold text-success-ink">{t('price.free')}</span>
                    <span className="rounded-full bg-success-tint px-2.5 py-0.5 text-xs font-semibold text-success-ink">
                      {t('price.lifetime')}
                    </span>
                  </div>
                ) : course.discountPercent ? (
                  // Mã giảm giá (15/09/2026, mở rộng) — chỉ coupon `autoApply=true` hiện trực
                  // tiếp ở đây, không cần nhập mã (BR-COUPON-04).
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-3xl font-extrabold text-ink">{money(course.finalPrice)}</span>
                      <span className="rounded bg-danger/10 px-2 py-0.5 text-sm font-bold text-danger">
                        -{course.discountPercent}%
                      </span>
                    </div>
                    <span className="text-sm text-ink-muted line-through">{money(course.price)}</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold text-ink">{money(course.price)}</span>
                    <span className="rounded-full bg-tint px-2.5 py-0.5 text-xs font-semibold text-accent-dark">
                      {t('price.lifetime')}
                    </span>
                  </div>
                )}

                <EnrollButton
                  courseId={course.id}
                  courseSlug={course.slug}
                  isFree={course.isFree}
                  enrolled={course.enrolled}
                  firstLessonId={firstLesson?.id ?? null}
                  requiresPassword={course.requiresPassword}
                />

                <ul className="m-0 mt-1 flex list-none flex-col gap-2 p-0 text-sm text-ink-muted">
                  {(t.raw('includes') as string[]).map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-success-ink" />
                      <span>{line.replace('{count}', String(totalLessons))}</span>
                    </li>
                  ))}
                </ul>

                {/* Bundle Upsell (29/09/2026) — hiển thị gói combo nếu khóa học có trong gói */}
                <BundleUpsellWidget courseId={course.id} />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <RelatedCourses categorySlug={course.categorySlug} courseId={course.id} />
    </div>
  );
}
