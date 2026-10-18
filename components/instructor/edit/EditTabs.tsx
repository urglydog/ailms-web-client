'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { EDIT_TABS, activeEditTab, editTabHref, type EditTabGroup } from '@/lib/instructor/editNav';

interface EditTabsProps {
  courseId: number;
  pathname: string;
  /** Đang mở trang Cài đặt thì không tab nào được đánh dấu. */
  settingsOpen: boolean;
}

const GROUPS: EditTabGroup[] = ['content', 'publish'];

/** Thanh tab ngang của trình chỉnh sửa khóa học, chia hai nhóm (Nội dung, Đăng tải); cuộn ngang được trên màn nhỏ. */
export function EditTabs({ courseId, pathname, settingsOpen }: EditTabsProps) {
  const t = useTranslations('instructor.edit');
  const active = settingsOpen ? null : activeEditTab(pathname, courseId);

  return (
    <nav aria-label={t('tabsAria')} className="border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-[1400px] gap-6 overflow-x-auto px-4 sm:px-8">
        {GROUPS.map((group) => (
          <div key={group} className="flex shrink-0 flex-col">
            <span className="pt-2 text-[10.5px] font-bold uppercase tracking-wide text-ink-muted">{t(`groups.${group}`)}</span>
            <div className="flex">
              {EDIT_TABS.filter((tab) => tab.group === group).map((tab) => {
                const isActive = active === tab.key;
                return (
                  <Link
                    key={tab.key}
                    href={editTabHref(courseId, tab.key)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-semibold no-underline transition-colors ${
                      isActive ? 'border-accent text-accent-dark' : 'border-transparent text-ink-muted hover:text-ink'
                    }`}
                  >
                    {t(`tabs.${tab.key}`)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
