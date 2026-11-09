'use client';

import { useTranslations } from 'next-intl';

/** Liên kết đầu trang cho người dùng bàn phím: chỉ hiện khi được focus, nhảy thẳng tới nội dung. */
export function SkipLink() {
  const t = useTranslations('header');
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:no-underline"
    >
      {t('skipToContent')}
    </a>
  );
}
