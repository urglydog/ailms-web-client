'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export default function TermsPage() {
  const t = useTranslations('legal.terms');
  const b = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
  // eslint-disable-next-line react/display-name
  const link = (href: string) => (chunks: React.ReactNode) => <Link href={href}>{chunks}</Link>;
  return (
    <LegalPageLayout title={t('title')} updatedAt="14/11/2026" intro={<p>{t('intro')}</p>}>
      <LegalSection title={t('s1Title')}>
        <p>{t.rich('s1p1', { link: link('/teaching') })}</p>
        <p>{t.rich('s1p2', { b })}</p>
      </LegalSection>

      <LegalSection title={t('s2Title')}>
        <p>{t('s2p1')}</p>
        <p>{t.rich('s2p2', { link: link('/legal/content-moderation') })}</p>
      </LegalSection>

      <LegalSection title={t('s3Title')}>
        <p>{t.rich('s3p1', { link: link('/legal/refund') })}</p>
        <p>{t.rich('s3p2', { link: link('/legal/revenue-share') })}</p>
      </LegalSection>

      <LegalSection title={t('s3aTitle')}>
        <p>
          {t.rich('s3ap1', {
            b,
            revenueLink: link('/legal/revenue-share'),
            refundLink: link('/legal/refund'),
          })}
        </p>
      </LegalSection>

      <LegalSection title={t('s4Title')}>
        <p>{t('s4p1')}</p>
      </LegalSection>

      <LegalSection title={t('s5Title')}>
        <p>{t('s5p1')}</p>
      </LegalSection>

      <LegalSection title={t('s6Title')}>
        <p>{t('s6p1')}</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
