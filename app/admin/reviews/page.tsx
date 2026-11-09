'use client';

import { useTranslations } from 'next-intl';
import { ReviewManager } from '@/components/admin/ReviewManager';
import { PageHeader } from '@/components/instructor/ui/PageHeader';

export default function AdminReviewsPage() {
  const t = useTranslations('admin.reviews');
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <ReviewManager />
    </>
  );
}
