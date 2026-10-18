'use client';

import { useTranslations } from 'next-intl';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { PageHeader } from '@/components/instructor/ui/PageHeader';

export default function AdminCategoriesPage() {
  const t = useTranslations('admin.categories');
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <CategoryManager />
    </>
  );
}
