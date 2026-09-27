'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

/** (26/09/2026, thiết kế lại) — trước đây chỉ có 2 cột (giới thiệu ngắn + liên hệ), thiếu hẳn
 * lối vào các trang chính sách/quy định của hệ thống (tham khảo bố cục chân trang Udemy, lược bỏ
 * phần logo đối tác doanh nghiệp/Udemy Business vì không áp dụng cho dự án này).
 *
 * Chuyển thành Client Component (26/09/2026, tính năng đổi ngôn ngữ) — cần `useTranslations` để
 * đổi chữ theo ngôn ngữ đang chọn (`LocaleProvider`), không thể là Server Component tĩnh nữa.
 */
export function Footer() {
  const t = useTranslations('footer');

  const discoverLinks = [
    { label: t('discover.about'), href: '/about' },
    { label: t('discover.teaching'), href: '/teaching' },
    { label: t('discover.courses'), href: '/courses' },
    { label: t('discover.help'), href: '/help' },
  ];

  const legalLinks = [
    { label: t('legal.terms'), href: '/legal/terms' },
    { label: t('legal.privacy'), href: '/legal/privacy' },
    { label: t('legal.refund'), href: '/legal/refund' },
    { label: t('legal.revenueShare'), href: '/legal/revenue-share' },
    { label: t('legal.contentModeration'), href: '/legal/content-moderation' },
    { label: t('legal.cookies'), href: '/legal/cookies' },
    { label: t('legal.accessibility'), href: '/legal/accessibility' },
  ];

  return (
    <footer className="mt-20 border-t border-line bg-surface-raised">
      <div className="shell py-10 grid grid-cols-2 gap-8 text-sm md:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-2 md:col-span-1">
          <span className="font-display font-bold text-ink">LinguaLearn</span>
          <span className="text-ink-muted">{t('tagline')}</span>
        </div>

        <FooterColumn title={t('discoverTitle')} links={discoverLinks} />
        <FooterColumn title={t('legalTitle')} links={legalLinks} />

        <div className="flex flex-col gap-2">
          <span className="font-display font-bold text-ink">{t('contactTitle')}</span>
          <a href="tel:02838940390" className="text-ink-muted hover:text-accent transition-colors">{t('phoneLabel')}: 0283.8940 390</a>
          <a href="mailto:csm@iuh.edu.vn" className="text-ink-muted hover:text-accent transition-colors">{t('emailLabel')}: csm@iuh.edu.vn</a>
        </div>
      </div>

      <div className="border-t border-line-soft">
        <div className="shell flex flex-col gap-2 py-4 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <span>{t('copyright', { year: new Date().getFullYear() })}</span>
          <Link href="/legal/sitemap" className="text-ink-faint hover:text-accent transition-colors">{t('sitemap')}</Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-display font-bold text-ink">{title}</span>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="text-ink-muted hover:text-accent transition-colors">
          {link.label}
        </Link>
      ))}
    </div>
  );
}
