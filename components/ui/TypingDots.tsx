'use client';

import { useTranslations } from 'next-intl';

/**
 * Ba chấm "đang trả lời" dùng chung cho các khung chat. Mờ dần lần lượt (chỉ opacity, so le
 * 160ms) thay cho kiểu nảy `animate-bounce` — nhẹ mắt hơn khi nhìn lâu, và không dịch chuyển nên
 * vẫn hợp lệ khi người dùng bật giảm chuyển động. Màu lấy từ token `accent`.
 */
export function TypingDots({ label }: { label?: string }) {
  const t = useTranslations('common.typing');
  const ariaLabel = label ?? t('replying');
  return (
    <span role="status" aria-label={ariaLabel} className="inline-flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="typing-dot h-2 w-2 rounded-full bg-accent"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}
