'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

const TABS = [
  { key: 'overview', href: '/instructor/revenue' },
  { key: 'revenue', href: '/instructor/revenue/list' },
  { key: 'students', href: '/instructor/revenue/students' },
  { key: 'reviews', href: '/instructor/revenue/reviews' },
  { key: 'hardQuestions', href: '/instructor/revenue/hard-questions' },
  { key: 'retention', href: '/instructor/revenue/retention' },
] as const;

/** Thanh tab ngang của khu Hiệu suất; cuộn ngang được trên màn nhỏ. "Tổng quan" chỉ sáng ở đúng trang gốc. */
export function PerformanceTabs({ pathname }: { pathname: string }) {
  const t = useTranslations('instructor.performance');
  return (
    <nav aria-label={t('tabsAria')} className="-mb-1 overflow-x-auto border-b border-line">
      <div className="flex gap-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[13px] font-semibold no-underline transition-colors ${
                active ? 'border-accent text-accent-dark' : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {t(`tabs.${tab.key}`)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
