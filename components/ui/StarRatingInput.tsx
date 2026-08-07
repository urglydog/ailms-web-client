'use client';

import { useState } from 'react';

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
}

/** 5 sao bấm chọn được — dùng cho form viết đánh giá (UC23). Khác `StarRating.tsx` (chỉ hiển thị). */
export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Chọn số sao đánh giá">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} sao`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className={`text-2xl leading-none transition-colors ${
            star <= display ? 'text-star' : 'text-line'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
