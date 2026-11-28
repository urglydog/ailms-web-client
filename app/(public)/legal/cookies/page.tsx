'use client';

import { useTranslations } from 'next-intl';
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export default function CookiesPolicyPage() {
  const t = useTranslations('legal.cookies');
  const b = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
  return (
    <LegalPageLayout title={t('title')} updatedAt="26/09/2026">
      <LegalSection title={t('s1Title')}>
        <p>{t.rich('s1p1', { b })}</p>
      </LegalSection>

      <LegalSection title={t('s2Title')}>
        <p>{t('s2p1')}</p>
        <p>{t('s2p2')}</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
