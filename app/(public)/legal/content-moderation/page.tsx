'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export default function ContentModerationPolicyPage() {
  const t = useTranslations('legal.moderation');
  const b = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
  return (
    <LegalPageLayout title={t('title')} updatedAt="26/09/2026">
      <LegalSection title={t('s1Title')}>
        <p>{t.rich('s1p1', { b })}</p>
        <p>{t('s1p2')}</p>
      </LegalSection>

      <LegalSection title={t('s2Title')}>
        <p>{t('s2p1')}</p>
      </LegalSection>

      <LegalSection title={t('s3Title')}>
        <p>{t('s3p1')}</p>
      </LegalSection>

      <LegalSection title={t('s4Title')}>
        <p>{t.rich('s4p1', { link: (chunks) => <Link href="/legal/terms">{chunks}</Link> })}</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
