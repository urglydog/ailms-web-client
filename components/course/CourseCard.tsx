import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import type { CourseSummary } from '@/types/domain';

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
  return (
    <Link
      href={`/courses/${course.slug}`}
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
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="line-clamp-2 min-h-[44px] font-display text-base font-semibold leading-snug text-ink">
          {course.title}
        </span>
        <span className="text-[13px] text-ink-muted">GV. {course.instructorName}</span>

        <StarRating
          rating={course.avgRating}
          reviewCount={course.reviewCount}
          levelLabel={LEVEL_LABEL[course.level]}
        />

        <div className="mt-auto flex items-center justify-between border-t border-line-soft pt-2">
          {course.isFree ? (
            <span className="font-display text-[15px] font-bold text-success">Miễn phí</span>
          ) : (
            <span className="font-display text-[15px] font-bold text-ink">
              {formatPrice(course.price)}
            </span>
          )}
          <span className="text-xs font-semibold text-accent">Xem chi tiết →</span>
        </div>
      </div>
    </Link>
  );
}
