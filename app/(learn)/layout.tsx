'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LearnTitleProvider, useLearnTitle, useLearnProgress } from '@/components/layout/LearnTitleContext';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getAccessToken } from '@/lib/auth/token';

/**
 * Trang xem bài học cần tối đa không gian dọc cho video (điểm #1 trong yêu cầu chỉnh UI —
 * giảm cuộn trang), nên KHÔNG dùng `<Header>` đầy đủ (tìm kiếm/nav/giỏ hàng/thông báo) như các
 * trang khác — tham khảo Udemy: logo và tên khóa học nằm chung 1 hàng mảnh, không phải header
 * marketing đầy đủ. Vẫn cần 1 heading rõ ràng có thể bấm về trang chủ (điểm #3), luôn hiển thị
 * kể cả lúc trang con đang tải (tên khóa học rỗng thì chỉ hiện logo).
 *
 * (17/10/2026, spec UI/UX học viên mục 7) — thêm nút quay về "Khóa học của tôi" (chỉ khi đã đăng nhập;
 * khách xem thử không có trang đó) và thanh tiến độ dùng `ProgressBar` chung.
 */
function LearnHeaderBar() {
  const t = useTranslations('learn.header');
  const courseTitle = useLearnTitle();
  const progressPct = useLearnProgress();
  // Đọc token sau khi gắn kết để HTML máy chủ (không có token) khớp lần render đầu của trình duyệt.
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    setLoggedIn(!!getAccessToken());
  }, []);

  return (
    <div className="sticky top-0 z-30 border-b border-line bg-surface-raised">
      <div className="mx-auto flex h-12 max-w-[1800px] items-center gap-3 px-4 md:px-8">
        {loggedIn && (
          <Link
            href="/my-courses"
            className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[13px] font-medium text-ink-muted no-underline hover:bg-tint hover:text-accent-dark hover:no-underline"
          >
            <ArrowLeft size={16} aria-hidden />
            <span className="sr-only sm:not-sr-only">{t('back')}</span>
          </Link>
        )}
        <Link href="/" className="flex shrink-0 items-center gap-2 no-underline">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-accent font-display text-[13px] font-bold text-white">
            L
          </span>
          <span className="sr-only whitespace-nowrap font-display text-[14px] font-bold text-ink sm:not-sr-only">
            LinguaLearn
          </span>
        </Link>
        {courseTitle && (
          <>
            <span className="h-5 w-px shrink-0 bg-line" aria-hidden />
            <span className="truncate text-[14px] font-semibold text-ink-muted">{courseTitle}</span>
          </>
        )}
        {progressPct !== null && (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <ProgressBar value={progressPct} label={courseTitle ?? ''} className="w-24 md:w-40" />
            <span className="whitespace-nowrap text-[12px] font-semibold text-ink-muted">
              {Math.round(progressPct)}%
            </span>
          </div>
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
