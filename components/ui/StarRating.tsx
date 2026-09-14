interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  levelLabel?: string;
}

/** Path ngôi sao 5 cánh ĐỐI XỨNG trái-phải quanh x=12 trong viewBox 24×24 — bắt buộc phải đối
 * xứng để cắt theo % chiều rộng khớp đúng hình học (vd 50% phải lộ ra đúng NỬA TRÁI hình sao). */
const STAR_PATH = 'M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 19.771l-7.416 3.642 1.48-8.279L0 9.306l8.332-1.151z';

/**
 * 5 icon sao kiểu Udemy (14/09/2026, thiết kế lại theo yêu cầu) — trước đây chỉ hiện 1 ký tự
 * ★ tượng trưng + số điểm, không trực quan bằng 5 sao thật. Mỗi sao tô đầy theo đúng tỉ lệ
 * (`fillPercent`) so với điểm trung bình — sao thứ i tô đầy 100% nếu `rating >= i+1`, tô 1
 * phần nếu điểm nằm giữa (vd rating=4.6 thì sao thứ 5 tô 60%), tô 0% nếu chưa tới.
 *
 * Vẽ bằng 2 lớp SVG chồng (nền xám `line-dot` + lớp cam `star` nằm trong khung bị
 * `overflow-hidden` cắt theo width %) — KHÔNG dùng ký tự Unicode "★" như bản đầu tiên: glyph
 * font có phần đệm/lệch nội tại trong hộp chữ, cắt theo % chiều rộng của khung chữ không khớp
 * đúng 50% hình học thật của ngôi sao (đúng lỗi người dùng phát hiện — sao 4.5 mà nhìn quá nửa).
 * SVG dùng path DỰNG SẴN, đối xứng tuyệt đối nên cắt theo % luôn khớp chính xác.
 */
function StarIcon({ fillPercent }: { fillPercent: number }) {
  return (
    <span className="relative inline-block h-[13px] w-[13px] shrink-0" aria-hidden>
      <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full text-line-dot" fill="currentColor">
        <path d={STAR_PATH} />
      </svg>
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
        <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] text-star" fill="currentColor">
          <path d={STAR_PATH} />
        </svg>
      </span>
    </span>
  );
}

export function StarRating({ rating, reviewCount, levelLabel }: StarRatingProps) {
  const stars = [0, 1, 2, 3, 4].map((i) => Math.max(0, Math.min(100, (rating - i) * 100)));

  return (
    <div className="flex items-center gap-1.5 text-sm text-ink-muted">
      <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
      <span className="flex items-center gap-0.5">
        {stars.map((fillPercent, i) => (
          <StarIcon key={i} fillPercent={fillPercent} />
        ))}
      </span>
      {reviewCount !== undefined && <span>({reviewCount.toLocaleString('vi-VN')})</span>}
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
