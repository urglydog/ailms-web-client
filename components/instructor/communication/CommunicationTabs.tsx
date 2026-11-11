'use client';

import { useTranslations } from 'next-intl';
import { SectionTabs } from '@/components/instructor/SectionTabs';

const KEYS = ['qa', 'messages', 'assignments', 'announcements', 'refunds'] as const;

/** Tab của khu Giao tiếp: Hỏi đáp (mặc định), Tin nhắn, Bài tập, Thông báo, Hoàn tiền (11/11/2026). */
export function CommunicationTabs({ pathname }: { pathname: string }) {
  const t = useTranslations('instructor.communication');
  return (
    <SectionTabs
      ariaLabel={t('tabsAria')}
      pathname={pathname}
      tabs={KEYS.map((key) => ({ key, href: `/instructor/communication/${key}`, label: t(`tabs.${key}`) }))}
    />
  );
}
