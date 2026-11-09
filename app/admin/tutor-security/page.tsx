'use client';

import { useTranslations } from 'next-intl';
import { TutorSecurityFlagsManager } from '@/components/admin/TutorSecurityFlagsManager';
import { PageHeader } from '@/components/instructor/ui/PageHeader';

export default function AdminTutorSecurityPage() {
  const t = useTranslations('admin.tutorSec');
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <TutorSecurityFlagsManager />
    </>
  );
}
