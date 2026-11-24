'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type MouseEvent } from 'react';
import { Award } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import type { CourseSummary } from '@/types/domain';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { useAddToCart, useCart } from '@/hooks/useCart';
import { useAddToWishlist, useRemoveFromWishlist, useWishlist } from '@/hooks/useWishlist';

/**
 * Thẻ khoá học DUY NHẤT cho mọi kệ / lưới / gợi ý (doc/feat/uiux/UDEMY_LAYOUT_ANALYSIS.md mục 1).
 *
 * Thứ tự cố định: ảnh 16:9 → tên (2 dòng) → giảng viên → nhãn lồng tiếng + ★ + số đánh giá →
 * giá (giá gốc gạch ngang) → hành động (thêm vào giỏ / xem chứng chỉ).
 *
 * Ảnh bìa: khi `thumbnailUrl` còn null thì dùng dải gradient chéo theo hai màu của khoá học
 * (màu dữ liệu của từng khóa, không phải màu giao diện).
 */

function formatPrice(price: number): string {
  return `${price.toLocaleString('vi-VN')}đ`;
}

export function CourseCard({ course }: { course: CourseSummary }) {
  const t = useTranslations('courseCard');
  const router = useRouter();
  const { data: enrollments } = useMyEnrollments();
  const enrollment = enrollments?.find((e) => e.courseId === course.id);
  const isOwned = !!enrollment;

  // Giỏ hàng — chỉ khóa TRẢ PHÍ, CHƯA sở hữu mới cần nút này (khóa miễn phí ghi danh thẳng).
  const { data: cartItems } = useCart();
  const inCart = cartItems?.some((item) => item.courseId === course.id) ?? false;
  const addToCart = useAddToCart();
  const canAddToCart = !isOwned && !course.isFree;

  const handleAddToCart = (e: MouseEvent) => {
    // Cả thẻ là 1 <Link> — chặn điều hướng mặc định khi bấm đúng nút này.
    e.preventDefault();
    e.stopPropagation();
    // Đã có trong giỏ thì nút thành lối tắt "Đi đến giỏ hàng" (BR-CART-02: không tạo dòng trùng).
    if (inCart) {
      router.push('/cart');
      return;
    }
    if (addToCart.isPending) return;
    addToCart.mutate(course.id);
  };

  // Danh sách yêu thích — ẩn với khóa đã sở hữu.
  const { data: wishlistItems } = useWishlist();
  const inWishlist = wishlistItems?.some((item) => item.courseId === course.id) ?? false;
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const wishlistPending = addToWishlist.isPending || removeFromWishlist.isPending;

  const handleToggleWishlist = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlistPending) return;
    if (inWishlist) removeFromWishlist.mutate(course.id);
    else addToWishlist.mutate(course.id);
  };

  const targetHref = isOwned && enrollment.firstLessonId
    ? `/learn/${enrollment.firstLessonId}`
    : `/courses/${course.slug}`;

  // Điều hướng tới trang chứng chỉ (xem trước / chia sẻ / tải PDF).
  const handleGoToCertificate = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (enrollment?.certificateCode) router.push(`/certificates/${enrollment.certificateCode}`);
  };

  return (
    <Link
      href={targetHref}
      className="card-interactive group flex h-full flex-col overflow-hidden no-underline hover:no-underline"
    >
      {/* 1. Ảnh bìa 16:9 */}
      <div
        className="relative flex aspect-video items-center justify-center overflow-hidden"
        style={
          course.thumbnailUrl
            ? undefined
            : {
                background: `repeating-linear-gradient(135deg, ${course.coverColorA}, ${course.coverColorA} 14px, ${course.coverColorB} 14px, ${course.coverColorB} 28px)`,
              }
        }
      >
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 ease-soft group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <span className="rounded-full bg-ink/35 px-2.5 py-1 font-mono text-[11px] tracking-wide text-white/85">
            {t('coverPlaceholder')}
          </span>
        )}

        {!isOwned && (
          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={wishlistPending}
            aria-label={inWishlist ? t('wishlistRemove') : t('wishlistAdd')}
            aria-pressed={inWishlist}
            className={`absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised/90 shadow-sm transition-colors ${
              inWishlist ? 'text-danger' : 'text-ink-faint hover:text-danger'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}

        {course.isFree && (
          <div className="absolute left-2.5 top-2.5">
            <Badge tone="success">{t('free')}</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {/* 2. Tên — 2 dòng */}
        <span className="line-clamp-2 min-h-[38px] font-display text-sm font-semibold leading-snug text-ink">
          {course.title}
        </span>
        {/* 3. Giảng viên */}
        <span className="truncate text-xs text-ink-muted">{t('instructor', { name: course.instructorName })}</span>

        {/* 4. Nhãn lồng tiếng (thay "Bestseller") + ★ + số đánh giá */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            title={course.langs.length > 0 ? course.langs.map((l) => l.label).join(', ') : undefined}
            className="rounded-chip bg-tint px-1.5 py-0.5 text-[11px] font-semibold text-ink"
          >
            {t('aiDub')}
          </span>
          <StarRating
            rating={course.avgRating}
            reviewCount={course.reviewCount}
            levelLabel={t(`level.${course.level}`)}
          />
        </div>

        {isOwned && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${Math.min(100, Math.max(0, enrollment.progressPct))}%` }}
              />
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-ink-muted">
              {Math.round(enrollment.progressPct)}%
            </span>
          </div>
        )}

        {/* 5. Giá + 6. hành động */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-soft pt-2">
          {isOwned ? (
            enrollment.progressPct >= 100 && enrollment.certificateCode ? (
              <button
                type="button"
                onClick={handleGoToCertificate}
                className="flex items-center gap-1.5 font-display text-[13px] font-bold text-accent transition-colors hover:text-accent-dark"
              >
                <Award className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                {t('viewCertificate')}
              </button>
            ) : (
              <span className="font-display text-[15px] font-bold text-ink">{t('owned')}</span>
            )
          ) : course.isFree ? (
            <span className="font-display text-[15px] font-bold text-success">{t('free')}</span>
          ) : course.discountPercent ? (
            // Chỉ coupon `autoApply=true` hiện trực tiếp ở thẻ khóa học (BR-COUPON-04).
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[15px] font-bold text-ink">
                {formatPrice(course.finalPrice)}
              </span>
              <span className="text-xs text-ink-faint line-through">
                <span className="sr-only">{t('originalPrice')} </span>
                {formatPrice(course.price)}
              </span>
              <span className="rounded bg-danger/10 px-1.5 py-0.5 text-[11px] font-bold text-danger">
                -{course.discountPercent}%
              </span>
            </div>
          ) : (
            <span className="font-display text-[15px] font-bold text-ink">
              {formatPrice(course.price)}
            </span>
          )}

          {canAddToCart && (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addToCart.isPending}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                inCart
                  ? 'bg-success/10 text-success hover:bg-success/20'
                  : 'bg-accent text-white hover:bg-accent-dark hover:text-white'
              } disabled:cursor-not-allowed`}
            >
              {inCart ? t('goToCart') : addToCart.isPending ? t('adding') : t('addToCart')}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
