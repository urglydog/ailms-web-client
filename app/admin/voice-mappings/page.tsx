'use client';

import { useTranslations } from 'next-intl';
import { VoiceMappingManager } from '@/components/admin/VoiceMappingManager';
import { PageHeader } from '@/components/instructor/ui/PageHeader';

export default function AdminVoiceMappingsPage() {
  const t = useTranslations('admin.voices');
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <VoiceMappingManager />
    </>
  );
}
