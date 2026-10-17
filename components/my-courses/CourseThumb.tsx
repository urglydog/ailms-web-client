import Image from 'next/image';
import { BookOpen } from 'lucide-react';

/** Ảnh bìa khóa học; chưa có ảnh thì ô nền nhạt kèm biểu tượng sách. Kích thước do `className` của nơi dùng. */
export function CourseThumb({
  thumbnailUrl,
  title,
  className = '',
}: {
  thumbnailUrl: string | null;
  title: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-tint ${className}`}>
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover transition-transform duration-[400ms] ease-soft group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-accent">
          <BookOpen size={22} aria-hidden />
        </div>
      )}
    </div>
  );
}
