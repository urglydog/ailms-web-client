'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import type { CourseSummary } from '@/types/domain';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { useAddToCart, useCart } from '@/hooks/useCart';
import { useAddToWishlist, useRemoveFromWishlist, useWishlist } from '@/hooks/useWishlist';

/**
 * Thẻ khoá học — dịch từ `CourseCard.dc.html` của Claude Design.
 *
 * Prop trong design đã có `tsType` sẵn nên map gần như 1-1; điểm khác duy nhất là
 * ở đây nhận nguyên object `CourseSummary` thay vì 11 prop rời, để khi backend đổi
 * DTO thì chỉ sửa một chỗ.
 *
 * Ảnh bìa: khi `thumbnailUrl` còn null thì dùng dải gradient chéo theo hai màu của
 * khoá học — giữ đúng cách design xử lý placeholder, tránh khoảng trống trắng.
 */

const LEVEL_LABEL: Record<CourseSummary['level'], string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

function formatPrice(price: number): string {
  return `${price.toLocaleString('vi-VN')}đ`;
}

export function CourseCard({ course }: { course: CourseSummary }) {
  const router = useRouter();
  const { data: enrollments } = useMyEnrollments();
  const enrollment = enrollments?.find((e) => e.courseId === course.id);
  const isOwned = !!enrollment;

  // Giỏ hàng (06/09/2026, mở rộng ngoài đặc tả gốc) — chỉ khóa TRẢ PHÍ, CHƯA sở hữu mới cần
  // nút này (khóa miễn phí ghi danh thẳng, không qua giỏ hàng).
  const { data: cartItems } = useCart();
  const inCart = cartItems?.some((item) => item.courseId === course.id) ?? false;
  const addToCart = useAddToCart();
  const canAddToCart = !isOwned && !course.isFree;

  const handleAddToCart = (e: MouseEvent) => {
    // Cả thẻ là 1 <Link> — chặn điều hướng mặc định (vào trang chi tiết) khi bấm đúng nút này.
    e.preventDefault();
    e.stopPropagation();
    // Đã có trong giỏ — kiểu Udemy: đổi hẳn thành lối tắt "Đi đến giỏ hàng" thay vì no-op
    // (BR-CART-02 vẫn đúng: bấm lại không tạo dòng giỏ hàng trùng, chỉ đổi ý nghĩa nút bấm).
    if (inCart) {
      router.push('/cart');
      return;
    }
    if (addToCart.isPending) return;
    addToCart.mutate(course.id);
  };

  // Danh sách yêu thích (14/09/2026, mở rộng ngoài đặc tả gốc) — không có lý do wishlist 1
  // khóa đã sở hữu rồi, ẩn hẳn nút cho gọn thay vì disable.
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

  return (
    <Link
      href={targetHref}
      className="card-interactive flex h-full flex-col overflow-hidden no-underline hover:no-underline"
    >
      {/* Ảnh bìa */}
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
            className="object-cover"
          />
        ) : (
          <span className="rounded-full bg-ink/35 px-2.5 py-1 font-mono text-[11px] tracking-wide text-white/85">
            ảnh bìa khoá học
          </span>
        )}

        {/* Cờ các ngôn ngữ đã có bản lồng tiếng + nút yêu thích (14/09/2026, mở rộng) */}
        <div className="absolute right-2.5 top-2.5 flex gap-1">
          {!isOwned && (
            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={wishlistPending}
              aria-label={inWishlist ? 'Bỏ khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
              aria-pressed={inWishlist}
              className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-colors ${
                inWishlist ? 'bg-white text-red-500' : 'bg-white/90 text-ink-faint hover:text-red-500'
              }`}
            >
              {/* SVG duy nhất cho cả 2 trạng thái, chỉ đổi fill — tránh lệch hình dạng như 2 ký tự Unicode ♥/♡ cũ. */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          )}
          {course.langs.map((lang) => (
            <span
              key={lang.code}
              title={lang.label}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[13px] shadow-sm"
            >
              {lang.flag}
            </span>
          ))}
        </div>

        {course.isFree && (
          <Badge tone="success" className="absolute left-2.5 top-2.5">
            Miễn phí
          </Badge>
        )}
      </div>

      {/* Nội dung */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="line-clamp-2 min-h-[38px] font-display text-sm font-semibold leading-snug text-ink">
          {course.title}
        </span>
        <span className="text-xs text-ink-muted">GV. {course.instructorName}</span>

        <StarRating
          rating={course.avgRating}
          reviewCount={course.reviewCount}
          levelLabel={LEVEL_LABEL[course.level]}
        />

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

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-soft pt-2">
          {isOwned ? (
            <span className="font-display text-[15px] font-bold text-accent">
              {enrollment.progressPct >= 100 ? 'Đã hoàn thành' : 'Đã sở hữu'}
            </span>
          ) : course.isFree ? (
            <span className="font-display text-[15px] font-bold text-success">Miễn phí</span>
          ) : course.discountPercent ? (
            // Mã giảm giá (15/09/2026, mở rộng) — chỉ coupon `autoApply=true` hiện trực tiếp ở
            // thẻ khóa học, không cần nhập mã (BR-COUPON-04).
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[15px] font-bold text-ink">
                {formatPrice(course.finalPrice)}
              </span>
              <span className="text-xs text-ink-faint line-through">{formatPrice(course.price)}</span>
              <span className="rounded bg-danger/10 px-1.5 py-0.5 text-[11px] font-bold text-danger">
                -{course.discountPercent}%
              </span>
            </div>
          ) : (
            <span className="font-display text-[15px] font-bold text-ink">
              {formatPrice(course.price)}
            </span>
          )}

          {/* Giỏ hàng (06/09/2026, mở rộng ngoài đặc tả gốc) — thay hẳn gợi ý "Xem chi tiết →"
              cũ: cả thẻ đã là 1 <Link> nên bấm đâu cũng vào được trang chi tiết, không cần
              nhắc lại; chỗ này dành cho hành động THẬT SỰ hữu ích hơn — thêm vào giỏ. */}
          {canAddToCart && (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addToCart.isPending}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                inCart
                  ? 'bg-success/10 text-success hover:bg-success/20'
                  : 'bg-accent text-white hover:bg-accent-dark'
              } disabled:cursor-not-allowed`}
            >
              {inCart ? 'Đi đến giỏ hàng' : addToCart.isPending ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
