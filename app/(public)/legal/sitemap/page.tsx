'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

const GROUPS: Array<{ titleKey: string; links: Array<{ key: string; href: string }> }> = [
  {
    titleKey: 'g1',
    links: [
      { key: 'home', href: '/' },
      { key: 'courses', href: '/courses' },
      { key: 'about', href: '/about' },
      { key: 'teaching', href: '/teaching' },
    ],
  },
  {
    titleKey: 'g2',
    links: [
      { key: 'login', href: '/login' },
      { key: 'register', href: '/register' },
      { key: 'profile', href: '/profile' },
      { key: 'myCourses', href: '/my-courses' },
      { key: 'wishlist', href: '/wishlist' },
      { key: 'cart', href: '/cart' },
      { key: 'payments', href: '/payments' },
    ],
  },
  {
    titleKey: 'g3',
    links: [
      { key: 'terms', href: '/legal/terms' },
      { key: 'privacy', href: '/legal/privacy' },
      { key: 'refund', href: '/legal/refund' },
      { key: 'revenueShare', href: '/legal/revenue-share' },
      { key: 'moderation', href: '/legal/content-moderation' },
      { key: 'cookies', href: '/legal/cookies' },
      { key: 'accessibility', href: '/legal/accessibility' },
    ],
  },
];

export default function SitemapPage() {
  const t = useTranslations('legal.sitemap');
  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-14">
      <h1 className="m-0 font-display text-[28px] font-bold text-ink">{t('title')}</h1>
      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {GROUPS.map((group) => (
          <div key={group.titleKey} className="flex flex-col gap-2">
            <h2 className="m-0 font-display text-[15px] font-semibold text-ink">{t(group.titleKey)}</h2>
            {group.links.map((link) => (
              <Link key={link.href} href={link.href} className="text-[13.5px] text-ink-muted hover:text-accent">
                {t(link.key)}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
