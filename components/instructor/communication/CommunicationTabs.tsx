'use client';

import { useTranslations } from 'next-intl';
import { SectionTabs } from '@/components/instructor/SectionTabs';

const KEYS = ['qa', 'insights', 'messages', 'assignments', 'announcements', 'refunds'] as const;

/** Tab của khu Giao tiếp: Hỏi đáp (mặc định), Insight AI (26/11/2026), Tin nhắn, Bài tập, Thông báo, Hoàn tiền (11/11/2026). */
export function CommunicationTabs({ pathname, badges }: { pathname: string; badges?: Record<string, number> }) {
  const t = useTranslations('instructor.communication');
  return (
    <SectionTabs
      ariaLabel={t('tabsAria')}
      pathname={pathname}
      tabs={KEYS.map((key) => ({ key, href: `/instructor/communication/${key}`, label: t(`tabs.${key}`), badge: badges?.[key] }))}
    />
  );
}
