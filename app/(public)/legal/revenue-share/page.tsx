'use client';

import { useTranslations } from 'next-intl';
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

const UL = 'm-0 flex list-disc flex-col gap-1.5 pl-5';

export default function RevenueSharePolicyPage() {
  const t = useTranslations('legal.revenue');
  const b = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
  return (
    <LegalPageLayout title={t('title')} updatedAt="17/11/2026" intro={<p>{t('intro')}</p>}>
      <LegalSection title={t('s1Title')}>
        <p>{t.rich('s1p1', { b })}</p>
      </LegalSection>

      <LegalSection title={t('s2Title')}>
        <p>{t.rich('s2p1', { b })}</p>
      </LegalSection>

      <LegalSection title={t('s3Title')}>
        <p>{t('s3p1')}</p>
      </LegalSection>

      <LegalSection title={t('s4Title')}>
        <p>{t('s4p1')}</p>
      </LegalSection>

      <LegalSection title={t('s5Title')}>
        <p>{t('s5p1')}</p>
        <ul className={UL}>
          <li>{t.rich('s5i1', { b })}</li>
          <li>{t.rich('s5i2', { b })}</li>
          <li>{t.rich('s5i3', { b })}</li>
        </ul>
        <p>{t('s5p2')}</p>
      </LegalSection>

      <LegalSection title={t('s6Title')}>
        <p>{t.rich('s6p1', { b })}</p>
        <ul className={UL}>
          <li>{t.rich('s6i1', { b })}</li>
          <li>{t.rich('s6i2', { b })}</li>
          <li>{t.rich('s6i3', { b })}</li>
        </ul>
        <p>{t.rich('s6p2', { b })}</p>
      </LegalSection>

      <LegalSection title={t('s7Title')}>
        <p>{t.rich('s7p1', { b })}</p>
        <ul className={UL}>
          <li>{t.rich('s7i1', { b })}</li>
          <li>{t.rich('s7i2', { b })}</li>
          <li>{t.rich('s7i3', { b })}</li>
          <li>{t('s7i4')}</li>
          <li>{t('s7i5')}</li>
        </ul>
        <p>{t('s7p2')}</p>
      </LegalSection>

      <LegalSection title={t('s8Title')}>
        <ul className={UL}>
          <li>{t('s8i1')}</li>
          <li>{t('s8i2')}</li>
          <li>{t('s8i3')}</li>
          <li>{t('s8i4')}</li>
          <li>{t('s8i5')}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t('s9Title')}>
        <p>{t.rich('s9p1', { b })}</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
