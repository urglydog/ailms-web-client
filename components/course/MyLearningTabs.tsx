'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

/**
 * Tiêu đề "Khóa học của tôi" + hai tab chuyển giữa "Tất cả khóa học" và "Yêu thích" (14/09/2026, mở rộng
 * ngoài đặc tả gốc). Chỉ 2 tab khớp đúng những gì dự án THẬT SỰ có.
 *
 * (17/10/2026) Bỏ nền đen full-bleed cũ (kiểu hero Udemy) theo thiết kế azure sáng: component này CHỈ vẽ
 * chữ, trang cha bọc nó trong dải nền `surface` có viền dưới (`my-courses/page.tsx`, `wishlist/page.tsx`).
 */
const TABS = [
  { href: '/my-courses', key: 'all', page: 'courses' },
  { href: '/wishlist', key: 'wishlist', page: 'wishlist' },
] as const;

export function MyLearningTabs({ active }: { active: (typeof TABS)[number]['page'] }) {
  const t = useTranslations('myCourses');
  return (
    <div className="flex flex-col gap-4">
      <h1 className="m-0 font-display text-3xl font-semibold text-ink">{t('title')}</h1>
      <nav className="flex gap-6 border-b border-line">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active === tab.page ? 'page' : undefined}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold no-underline hover:no-underline ${
              active === tab.page
                ? 'border-accent text-accent-dark hover:text-accent-dark'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {t(`tabs.${tab.key}`)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
