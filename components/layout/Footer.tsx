'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

/** (26/09/2026, thiết kế lại) — trước đây chỉ có 2 cột (giới thiệu ngắn + liên hệ), thiếu hẳn
 * lối vào các trang chính sách/quy định của hệ thống (tham khảo bố cục chân trang Udemy, lược bỏ
 * phần logo đối tác doanh nghiệp/Udemy Business vì không áp dụng cho dự án này).
 *
 * Chuyển thành Client Component (26/09/2026, tính năng đổi ngôn ngữ) — cần `useTranslations` để
 * đổi chữ theo ngôn ngữ đang chọn (`LocaleProvider`), không thể là Server Component tĩnh nữa.
 *
 * Giao diện azure: nền xanh nhạt, mỗi cột có tiêu đề (h2) để trình đọc màn hình nhảy theo cột; chữ phụ dùng
 * `ink-muted` (đạt tương phản AA), không dùng `ink-faint`.
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
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="shell grid grid-cols-2 gap-8 py-10 text-sm md:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
          <span className="flex items-center gap-2 font-display font-bold text-ink">
            <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm text-white">
              L
            </span>
            LinguaLearn
          </span>
          <span className="text-ink-muted">{t('tagline')}</span>
        </div>

        <FooterColumn title={t('discoverTitle')} links={discoverLinks} />
        <FooterColumn title={t('legalTitle')} links={legalLinks} />

        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-display text-sm font-bold text-ink">{t('contactTitle')}</h2>
          <a href="tel:02838940390" className="text-ink-muted transition-colors hover:text-accent-dark">
            {t('phoneLabel')}: 0283.8940 390
          </a>
          <a href="mailto:csm@iuh.edu.vn" className="text-ink-muted transition-colors hover:text-accent-dark">
            {t('emailLabel')}: csm@iuh.edu.vn
          </a>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-4 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <span>{t('copyright', { year: new Date().getFullYear() })}</span>
          <Link href="/legal/sitemap" className="text-ink-muted transition-colors hover:text-accent-dark">
            {t('sitemap')}
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="m-0 font-display text-sm font-bold text-ink">{title}</h2>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="text-ink-muted transition-colors hover:text-accent-dark">
          {link.label}
        </Link>
      ))}
    </div>
  );
}
