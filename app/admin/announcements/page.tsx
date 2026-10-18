'use client';

import { useTranslations } from 'next-intl';
import { SystemAnnouncementManager } from '@/components/admin/SystemAnnouncementManager';
import { PageHeader } from '@/components/instructor/ui/PageHeader';

export default function AdminAnnouncementsPage() {
  const t = useTranslations('admin.announce');
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <SystemAnnouncementManager />
    </>
  );
}
