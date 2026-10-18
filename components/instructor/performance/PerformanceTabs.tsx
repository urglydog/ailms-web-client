'use client';

import { useTranslations } from 'next-intl';
import { SectionTabs } from '@/components/instructor/SectionTabs';

const TABS = [
  { key: 'overview', href: '/instructor/revenue' },
  { key: 'revenue', href: '/instructor/revenue/list' },
  { key: 'students', href: '/instructor/revenue/students' },
  { key: 'reviews', href: '/instructor/revenue/reviews' },
  { key: 'hardQuestions', href: '/instructor/revenue/hard-questions' },
  { key: 'retention', href: '/instructor/revenue/retention' },
] as const;

/** Thanh tab ngang của khu Hiệu suất. "Tổng quan" chỉ sáng ở đúng trang gốc. */
export function PerformanceTabs({ pathname }: { pathname: string }) {
  const t = useTranslations('instructor.performance');
  return (
    <SectionTabs
      ariaLabel={t('tabsAria')}
      pathname={pathname}
      tabs={TABS.map((tab) => ({ ...tab, label: t(`tabs.${tab.key}`) }))}
    />
  );
}
