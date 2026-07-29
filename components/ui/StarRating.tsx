interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  levelLabel?: string;
}

/** Hiện điểm sao + số lượt đánh giá + trình độ, dùng ở CourseCard và trang chi tiết. */
export function StarRating({ rating, reviewCount, levelLabel }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-ink-muted">
      <span className="text-star" aria-hidden>
        ★
      </span>
      <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && <span>({reviewCount})</span>}
      {levelLabel && (
        <>
          <span className="text-line-dot" aria-hidden>
            ·
          </span>
          <span>{levelLabel}</span>
        </>
      )}
    </div>
  );
}
