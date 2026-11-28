'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export default function PrivacyPolicyPage() {
  const t = useTranslations('legal.privacy');
  const b = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
  // eslint-disable-next-line react/display-name
  const link = (href: string) => (chunks: React.ReactNode) => <Link href={href}>{chunks}</Link>;
  return (
    <LegalPageLayout title={t('title')} updatedAt="26/09/2026" intro={<p>{t('intro')}</p>}>
      <LegalSection title={t('s1Title')}>
        <p>{t('s1p1')}</p>
        <p>{t('s1p2')}</p>
        <p>{t.rich('s1p3', { link: link('/legal/terms') })}</p>
      </LegalSection>

      <LegalSection title={t('s2Title')}>
        <p>{t.rich('s2p1', { link: link('/profile') })}</p>
      </LegalSection>

      <LegalSection title={t('s3Title')}>
        <p>{t.rich('s3p1', { b, link: link('/legal/cookies') })}</p>
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
