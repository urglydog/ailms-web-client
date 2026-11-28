'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export default function RefundPolicyPage() {
  const t = useTranslations('legal.refund');
  const b = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
  const em = (chunks: React.ReactNode) => <em>{chunks}</em>;
  // eslint-disable-next-line react/display-name
  const link = (href: string) => (chunks: React.ReactNode) => <Link href={href}>{chunks}</Link>;
  return (
    <LegalPageLayout title={t('title')} updatedAt="17/11/2026" intro={<p>{t('intro')}</p>}>
      <LegalSection title={t('s1Title')}>
        <p>{t.rich('s1p1', { b })}</p>
        <p>{t.rich('s1p2', { em })}</p>
      </LegalSection>

      <LegalSection title={t('s2Title')}>
        <p>{t('s2p1')}</p>
      </LegalSection>

      <LegalSection title={t('s3Title')}>
        <ol className="m-0 flex list-decimal flex-col gap-1 pl-5">
          <li>{t.rich('s3i1', { link: link('/disputes/new') })}</li>
          <li>{t.rich('s3i2', { b })}</li>
          <li>{t('s3i3')}</li>
          <li>{t.rich('s3i4', { b })}</li>
        </ol>
        <p>{t('s3p1')}</p>
      </LegalSection>

      <LegalSection title={t('s4Title')}>
        <p>{t.rich('s4p1', { b })}</p>
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
          <li>{t('s4i1')}</li>
          <li>{t('s4i2')}</li>
          <li>{t('s4i3')}</li>
        </ul>
        <p>{t.rich('s4p2', { b, em })}</p>
      </LegalSection>

      <LegalSection title={t('s5Title')}>
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
          <li>{t('s5i1')}</li>
          <li>{t('s5i2')}</li>
          <li>{t('s5i3')}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t('s6Title')}>
        <p>{t.rich('s6p1', { link: link('/legal/revenue-share') })}</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
