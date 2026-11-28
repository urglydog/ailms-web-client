'use client';

import { useTranslations } from 'next-intl';
import { LegalPageLayout, LegalStubNotice } from '@/components/legal/LegalPageLayout';

export default function AccessibilityPage() {
  const t = useTranslations('legal.accessibility');
  return (
    <LegalPageLayout title={t('title')}>
      <LegalStubNotice />
    </LegalPageLayout>
  );
}
