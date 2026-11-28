'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAccessToken } from '@/lib/auth/token';
import { publicCoursesApi } from '@/lib/api/publicCourses';
import { Bot, Check, ChevronDown, Infinity as InfinityIcon, Layers, PlayCircle, Tag } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ChapterAccordion } from '@/components/course/ChapterAccordion';
import { CoursePreview } from '@/components/course/CoursePreview';
import { EnrollButton } from '@/components/course/EnrollButton';
import { ReferralCapture } from '@/components/course/ReferralCapture';
import { ReviewsSection } from '@/components/course/ReviewsSection';
import { CourseDubbingPanel } from '@/components/course/detail/CourseDubbingPanel';
import { CourseHero } from '@/components/course/detail/CourseHero';
import { RelatedCourses } from '@/components/course/detail/RelatedCourses';
import { PromoCountdown, ShareButton } from '@/components/course/detail/PurchaseExtras';
import { BundleUpsellWidget } from '@/components/bundles/BundleUpsellWidget';
import { CourseLiveBanner } from '@/components/live/CourseLiveBanner';
import { Avatar } from '@/components/ui/Avatar';
import { RichText } from '@/components/ui/RichText';
import type { CourseDetail } from '@/types/domain';

const INCLUDE_ICONS = [PlayCircle, Bot, Layers, InfinityIcon];

/** "3 giờ 25 phút" / "45 phút" — tổng thời lượng video của khóa. */
function formatTotal(sec: number, hourLabel: string, minuteLabel: string): string {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h} ${hourLabel} ${m} ${minuteLabel}` : `${m} ${minuteLabel}`;
}

/**
 * Thân trang chi tiết khóa học — dùng chung cho fetch phía server (SEO) và fetch lại phía client với JWT
 * (`CourseDetailClientRetry.tsx`, khóa "Riêng tư mời").
 *
 * Bố cục 2 cột (UDEMY_LAYOUT_ANALYSIS mục 4):
 *  - Trái: hero → ngôn ngữ lồng tiếng sẵn có → "Khóa học bao gồm" (lưới icon) → nội dung khóa học
 *    (accordion + Mở rộng tất cả + Xem thử) → mô tả (thu gọn) → giảng viên → đánh giá.
 *  - Phải: thẻ mua dính khi cuộn (xem thử, giá/giảm giá, giỏ hàng/mua/đăng ký/vào học, yêu thích, mã giảm giá).
 *  - Mobile: thẻ mua nằm dưới hero, thêm thanh giá + CTA dính ở đáy màn hình.
 * BE chưa có dữ liệu "Bạn sẽ học được gì" và "Yêu cầu" nên hai khối này chưa hiện.
 */
export function CourseDetailView({ course }: { course: CourseDetail }) {
  const t = useTranslations('courseDetail');
  const locale = useLocale();
  const [descOpen, setDescOpen] = useState(false);
  const totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  const allLessons = course.chapters.flatMap((ch) => ch.lessons);
  const totalSec = allLessons.reduce((sum, l) => sum + (l.durationSec || 0), 0);
  const previewLessons = allLessons.filter((lesson) => lesson.isPreview);
  const firstLesson = allLessons[0] ?? null;
  // Giảng viên xem trang của CHÍNH khoá mình (27/11/2026): thay nút mua/giỏ hàng/yêu thích/tặng bằng
  // "Chỉnh sửa khoá học" + "Vào học". Cờ do máy chủ tính (viewerIsOwner), không đoán ở FE.
  const token = typeof window === 'undefined' ? null : getAccessToken();
  const { data: viewer } = useQuery({
    queryKey: ['course-viewer', course.slug, !!token],
    queryFn: () => publicCoursesApi.getViewerFlags(course.slug, token as string),
    enabled: !!token,
    staleTime: 60_000,
  });
  const isOwner = viewer?.viewerIsOwner === true;
  const editHref = `/instructor/courses/${course.id}/edit`;
  const money = (n: number) => `${n.toLocaleString(locale)}đ`;
  const longDescription = (course.description ?? '').length > 600;

  const priceBlock = course.isFree ? (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-3xl font-extrabold text-success-ink">{t('price.free')}</span>
      <span className="rounded-full bg-success-tint px-2.5 py-0.5 text-xs font-semibold text-success-ink">
        {t('price.lifetime')}
      </span>
    </div>
  ) : course.discountPercent ? (
    // Chỉ coupon `autoApply=true` hiện trực tiếp ở đây (BR-COUPON-04).
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-extrabold text-ink">{money(course.finalPrice)}</span>
        <span className="text-sm text-ink-muted line-through">{money(course.price)}</span>
        <span className="rounded bg-danger/10 px-2 py-0.5 text-sm font-bold text-danger">-{course.discountPercent}%</span>
      </div>
    </div>
  ) : (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-3xl font-extrabold text-ink">{money(course.price)}</span>
      <span className="rounded-full bg-tint px-2.5 py-0.5 text-xs font-semibold text-accent-dark">{t('price.lifetime')}</span>
    </div>
  );

  return (
    <div className="pb-20 lg:pb-0">
      <ReferralCapture courseId={course.id} />
      <CourseHero course={course} />

      <div className="shell py-8 lg:py-12">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-14">
          {/* ── Cột nội dung ── */}
          <div className="flex min-w-0 flex-col gap-12">
            <CourseLiveBanner courseId={course.id} />
            <CourseDubbingPanel languages={course.dubbedLanguages} />

            {/* "Bạn sẽ học được gì" — chỉ khi giảng viên đã điền (UDEMY_LAYOUT_ANALYSIS mục 12). */}
            {(course.learningOutcomes?.length ?? 0) > 0 && (
              <section aria-labelledby="outcomes-title" className="rounded-card border border-line p-5 sm:p-6">
                <h2 id="outcomes-title" className="section-title mb-4">{t('goals.outcomesTitle')}</h2>
                <ul className="m-0 grid list-none gap-x-6 gap-y-3 p-0 sm:grid-cols-2">
                  {course.learningOutcomes?.map((line) => (
                    <li key={line} className="flex items-start gap-2.5 text-sm text-ink">
                      <Check size={18} aria-hidden className="mt-0.5 shrink-0 text-success" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="includes-title">
              <h2 id="includes-title" className="section-title mb-5">{t('includesTitle')}</h2>
              <ul className="m-0 grid list-none gap-x-6 gap-y-3 p-0 sm:grid-cols-2">
                {(t.raw('includes') as string[]).map((line, i) => {
                  const Icon = INCLUDE_ICONS[i] ?? PlayCircle;
                  return (
                    <li key={line} className="flex items-start gap-2.5 text-sm text-ink">
                      <Icon size={18} aria-hidden className="mt-0.5 shrink-0 text-ink-muted" />
                      <span>{line.replace('{count}', String(totalLessons))}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section aria-labelledby="content-title">
              <h2 id="content-title" className="section-title mb-3">{t('content.title')}</h2>
              <ChapterAccordion
                chapters={course.chapters}
                enrolled={course.enrolled}
                sourceLanguage={course.sourceLanguage}
                summary={t('content.totalSummary', {
                  chapters: course.chapters.length,
                  lessons: totalLessons,
                  duration: formatTotal(totalSec, t('time.hour'), t('time.minute')),
                })}
              />
            </section>

            {(course.requirements?.length ?? 0) > 0 && (
              <section aria-labelledby="requirements-title">
                <h2 id="requirements-title" className="section-title mb-4">{t('goals.requirementsTitle')}</h2>
                <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-sm text-ink">
                  {course.requirements?.map((line) => <li key={line}>{line}</li>)}
                </ul>
              </section>
            )}

            {course.description && (
              <section aria-labelledby="desc-title">
                <h2 id="desc-title" className="section-title mb-4">{t('description.title')}</h2>
                <div className={`relative ${longDescription && !descOpen ? 'max-h-72 overflow-hidden' : ''}`}>
                  <RichText text={course.description} />
                  {longDescription && !descOpen && (
                    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface to-transparent" />
                  )}
                </div>
                {longDescription && (
                  <button
                    type="button"
                    onClick={() => setDescOpen((v) => !v)}
                    aria-expanded={descOpen}
                    className="mt-3 flex min-h-10 items-center gap-1 text-sm font-semibold text-accent-dark hover:underline"
                  >
                    {descOpen ? t('description.showLess') : t('description.showMore')}
                    <ChevronDown size={16} aria-hidden className={descOpen ? 'rotate-180' : ''} />
                  </button>
                )}
              </section>
            )}

            {(course.targetAudience?.length ?? 0) > 0 && (
              <section aria-labelledby="audience-title">
                <h2 id="audience-title" className="section-title mb-4">{t('goals.audienceTitle')}</h2>
                <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-sm text-ink">
                  {course.targetAudience?.map((line) => <li key={line}>{line}</li>)}
                </ul>
              </section>
            )}

            <section aria-labelledby="instructor-title">
              <h2 id="instructor-title" className="section-title mb-4">{t('instructorBlock.title')}</h2>
              <div className="flex items-center gap-4">
                <Avatar name={course.instructorName} avatarUrl={course.instructorAvatarUrl} size={64} />
                <div>
                  <p className="m-0 font-display text-lg font-bold text-ink">{course.instructorName}</p>
                  <p className="m-0 mt-1 text-sm text-ink-muted">
                    {t('instructorBlock.stats', { rating: course.avgRating.toFixed(1), learners: course.learnerCount.toLocaleString(locale) })}
                  </p>
                </div>
              </div>
            </section>

            <section aria-labelledby="reviews-title">
              <h2 id="reviews-title" className="section-title mb-4">{t('reviews')}</h2>
              <ReviewsSection courseId={course.id} />
            </section>
          </div>

          {/* ── Thẻ mua (dính khi cuộn; mobile nằm ngay dưới hero) ── */}
          <aside id="purchase-card" className="order-first scroll-mt-20 lg:order-last lg:sticky lg:top-24 lg:self-start">
            <div className="card overflow-hidden">
              <CoursePreview thumbnailUrl={course.thumbnailUrl} courseTitle={course.title} previewLessons={previewLessons} />

              <div className="flex flex-col gap-4 p-6">
                {priceBlock}
                {!course.isFree && course.discountPercent ? <PromoCountdown endsAt={course.discountEndsAt} /> : null}

                {isOwner ? (
                  <div className="flex flex-col gap-2.5">
                    <p className="m-0 rounded-control bg-tint px-3 py-2 text-[13px] text-accent-dark">{t('owner.note')}</p>
                    <Link
                      href={editHref}
                      className="flex min-h-11 items-center justify-center rounded-control bg-accent px-4 text-sm font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
                    >
                      {t('owner.edit')}
                    </Link>
                    {firstLesson && (
                      <Link
                        href={`/learn/${firstLesson.id}`}
                        className="flex min-h-11 items-center justify-center rounded-control border border-line px-4 text-sm font-semibold text-ink no-underline hover:border-accent"
                      >
                        {t('owner.learn')}
                      </Link>
                    )}
                  </div>
                ) : (
                <>
                <EnrollButton
                  courseId={course.id}
                  courseSlug={course.slug}
                  isFree={course.isFree}
                  enrolled={course.enrolled}
                  firstLessonId={firstLesson?.id ?? null}
                  requiresPassword={course.requiresPassword}
                />

                {!course.isFree && !course.enrolled && (
                  <p className="m-0 flex items-center gap-1.5 text-[13px] text-ink-muted">
                    <Tag size={14} aria-hidden className="shrink-0" />
                    {t('coupon.note')}{' '}
                    <Link href={`/checkout/${course.slug}`} className="font-semibold text-accent-dark underline">
                      {t('coupon.link')}
                    </Link>
                  </p>
                )}

                <ShareButton title={course.title} slug={course.slug} />
                </>
                )}

                <BundleUpsellWidget courseId={course.id} />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <RelatedCourses categorySlug={course.categorySlug} courseId={course.id} />

      {/* Thanh giá + CTA dính đáy trên mobile — CTA cuộn tới thẻ mua để dùng đúng luồng mua/đăng ký. pr-24 chừa chỗ nút chat nổi (fixed bottom-6 right-6) để không che nút CTA (27/11/2026). */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-raised py-2.5 pl-4 pr-24 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 truncate text-[13px] font-semibold text-ink">{course.title}</p>
            <p className="m-0 text-sm font-bold text-ink">
              {course.isFree ? t('price.free') : money(course.discountPercent ? course.finalPrice : course.price)}
              {!course.isFree && course.discountPercent ? (
                <span className="ml-2 text-xs font-normal text-ink-faint line-through">{money(course.price)}</span>
              ) : null}
            </p>
          </div>
          {isOwner ? (
            <Link
              href={editHref}
              className="flex min-h-11 shrink-0 items-center rounded-control bg-accent px-4 text-sm font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
            >
              {t('owner.edit')}
            </Link>
          ) : course.enrolled && firstLesson ? (
            <Link
              href={`/learn/${firstLesson.id}`}
              className="flex min-h-11 shrink-0 items-center rounded-control bg-accent px-4 text-sm font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
            >
              {t('enroll.learnNow')}
            </Link>
          ) : (
            <a
              href="#purchase-card"
              className="flex min-h-11 shrink-0 items-center rounded-control bg-accent px-4 text-sm font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
            >
              {course.isFree ? t('enroll.free') : t('enroll.buy')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
