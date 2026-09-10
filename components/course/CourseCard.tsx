'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MouseEvent } from 'react';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import type { CourseSummary } from '@/types/domain';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { useAddToCart, useCart } from '@/hooks/useCart';

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
    // Cả thẻ là 1 <Link> — chặn điều hướng khi bấm đúng nút này (BR-CART-02: bấm lại khi đã
    // có trong giỏ chỉ là no-op, không gọi lại API cho đỡ tốn request).
    e.preventDefault();
    e.stopPropagation();
    if (inCart || addToCart.isPending) return;
    addToCart.mutate(course.id);
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

        {/* Cờ các ngôn ngữ đã có bản lồng tiếng */}
        <div className="absolute right-2.5 top-2.5 flex gap-1">
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

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-soft pt-2">
          {isOwned ? (
            <span className="font-display text-[15px] font-bold text-accent">Đã sở hữu</span>
          ) : course.isFree ? (
            <span className="font-display text-[15px] font-bold text-success">Miễn phí</span>
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
              disabled={inCart || addToCart.isPending}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                inCart
                  ? 'bg-success/10 text-success'
                  : 'bg-accent text-white hover:bg-accent-dark'
              } disabled:cursor-not-allowed`}
            >
              {inCart ? '✓ Đã có trong giỏ' : addToCart.isPending ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
