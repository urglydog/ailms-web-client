'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  EDIT_TABS,
  activeEditTab,
  editStepDone,
  editTabHref,
  type EditStepCourse,
  type EditTabGroup,
} from '@/lib/instructor/editNav';

interface EditTabsProps {
  courseId: number;
  pathname: string;
  /** Đang mở trang Cài đặt thì không tab nào được đánh dấu. */
  settingsOpen: boolean;
  /** Có thì chấm ✓ từng bước đã xong. */
  course?: EditStepCourse;
  /** Có thì hiện nút "Gửi duyệt" cuối checklist (chỉ ở dạng sidebar). */
  submit?: { onSubmit: () => void; canSubmit: boolean; submitting: boolean };
}

const GROUPS: EditTabGroup[] = ['plan', 'content', 'publish'];

/**
 * Checklist các bước của trình soạn khoá học (UDEMY_LAYOUT_ANALYSIS mục 12), 3 nhóm Lập kế hoạch / Tạo nội dung /
 * Xuất bản; bước đã xong có ✓. Dưới `lg` là thanh tab ngang cuộn được; từ `lg` là sidebar dọc bên trái có nút
 * "Gửi duyệt" ở cuối.
 */
export function EditTabs({ courseId, pathname, settingsOpen, course, submit }: EditTabsProps) {
  const t = useTranslations('instructor.edit');
  const active = settingsOpen ? null : activeEditTab(pathname, courseId);

  return (
    <nav
      aria-label={t('tabsAria')}
      className="border-b border-line bg-surface-raised lg:sticky lg:top-0 lg:max-h-dvh lg:w-64 lg:shrink-0 lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r"
    >
      <div className="mx-auto flex w-full max-w-[1400px] gap-6 overflow-x-auto px-4 sm:px-8 lg:flex-col lg:gap-5 lg:overflow-visible lg:px-4 lg:py-6">
        {GROUPS.map((group) => (
          <div key={group} className="flex shrink-0 flex-col">
            <span className="pt-2 text-[10.5px] font-bold uppercase tracking-wide text-ink-muted lg:pb-1 lg:pt-0">
              {t(`groups.${group}`)}
            </span>
            <ul className="m-0 flex list-none p-0 lg:flex-col">
              {EDIT_TABS.filter((tab) => tab.group === group).map((tab) => {
                const isActive = active === tab.key;
                const done = course ? editStepDone(course, tab.key) : null;
                return (
                  <li key={tab.key}>
                    <Link
                      href={editTabHref(courseId, tab.key)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-semibold no-underline transition-colors motion-reduce:transition-none lg:rounded-md lg:border-b-0 lg:border-l-2 lg:py-2 ${
                        isActive
                          ? 'border-accent text-accent-dark lg:bg-tint'
                          : 'border-transparent text-ink-muted hover:text-ink lg:hover:bg-surface'
                      }`}
                    >
                      {done !== null && (
                        <span
                          aria-hidden
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            done ? 'border-success bg-success text-surface-raised' : 'border-line'
                          }`}
                        >
                          {done && <Check size={11} strokeWidth={3} />}
                        </span>
                      )}
                      {t(`tabs.${tab.key}`)}
                      {done && <span className="sr-only"> ({t('stepDone')})</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {submit && (
          <button
            type="button"
            onClick={submit.onSubmit}
            disabled={!submit.canSubmit || submit.submitting}
            className="hidden w-full rounded-lg bg-accent px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none lg:block"
          >
            {submit.submitting ? t('checklist.submitting') : t('submit.send')}
          </button>
        )}
      </div>
    </nav>
  );
}
