'use client';

import Link from 'next/link';
import { LearnTitleProvider, useLearnTitle } from '@/components/layout/LearnTitleContext';

/**
 * Trang xem bài học cần tối đa không gian dọc cho video (điểm #1 trong yêu cầu chỉnh UI —
 * giảm cuộn trang), nên KHÔNG dùng `<Header>` đầy đủ (tìm kiếm/nav/giỏ hàng/thông báo) như các
 * trang khác — tham khảo Udemy: logo và tên khóa học nằm chung 1 hàng mảnh, không phải header
 * marketing đầy đủ. Vẫn cần 1 heading rõ ràng có thể bấm về trang chủ (điểm #3), luôn hiển thị
 * kể cả lúc trang con đang tải (tên khóa học rỗng thì chỉ hiện logo).
 */
function LearnHeaderBar() {
  const courseTitle = useLearnTitle();
  return (
    <div className="sticky top-0 z-30 border-b border-line bg-surface-raised">
      <div className="mx-auto flex h-12 max-w-[1800px] items-center gap-3 px-4 md:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 no-underline">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-accent font-display text-[13px] font-bold text-white">
            L
          </span>
          <span className="whitespace-nowrap font-display text-[14px] font-bold text-ink">
            LinguaLearn
          </span>
        </Link>
        {courseTitle && (
          <>
            <span className="h-5 w-px shrink-0 bg-line" aria-hidden />
            <span className="truncate text-[14px] font-semibold text-ink-muted">{courseTitle}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <LearnTitleProvider>
      <div className="flex min-h-dvh flex-col">
        <LearnHeaderBar />
        <main className="flex-1">{children}</main>
      </div>
    </LearnTitleProvider>
  );
}
