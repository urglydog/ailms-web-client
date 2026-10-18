'use client';

import Link from 'next/link';
import { ArrowLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { INSTRUCTOR_NAV, activeNavItem } from '@/lib/instructor/nav';
import { NAV_ICONS } from './navIcons';

interface InstructorSidebarProps {
  pathname: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

/** Thanh bên sáng của Kênh giảng viên (chỉ hiện từ `md` trở lên): nhãn luôn hiện rõ, có thể thu gọn thành cột icon. */
export function InstructorSidebar({ pathname, collapsed, onToggleCollapsed }: InstructorSidebarProps) {
  const t = useTranslations('instructor');
  const active = activeNavItem(pathname);

  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-white transition-[width] duration-200 ease-out md:flex ${
        collapsed ? 'w-[68px]' : 'w-60'
      }`}
    >
      <div className={`flex h-16 shrink-0 items-center gap-2.5 border-b border-line-soft ${collapsed ? 'justify-center' : 'px-5'}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-display text-base font-bold text-white" aria-hidden>
          L
        </span>
        {!collapsed && (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-display text-[15px] font-bold text-ink">{t('shell.brand')}</span>
            <span className="text-[11px] font-medium text-ink-muted">{t('shell.channel')}</span>
          </span>
        )}
      </div>

      <nav aria-label={t('nav.aria')} className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {INSTRUCTOR_NAV.map((item) => {
          const isActive = active?.id === item.id;
          const Icon = NAV_ICONS[item.id];
          const label = t(`nav.${item.id}`);
          return (
            <Link
              key={item.id}
              href={item.href}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg py-2.5 text-[13.5px] font-semibold no-underline transition-colors ${
                collapsed ? 'justify-center px-0' : 'px-3'
              } ${isActive ? 'bg-tint text-accent-dark' : 'text-ink-muted hover:bg-surface hover:text-ink'}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-line-soft px-3 py-3">
        <Link
          href="/"
          title={collapsed ? t('shell.backToStudent') : undefined}
          aria-label={collapsed ? t('shell.backToStudent') : undefined}
          className={`flex items-center gap-3 rounded-lg py-2 text-[13px] text-ink-muted no-underline hover:bg-surface hover:text-ink ${
            collapsed ? 'justify-center px-0' : 'px-3'
          }`}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {!collapsed && <span>{t('shell.backToStudent')}</span>}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t('shell.expand') : t('shell.collapse')}
          title={collapsed ? t('shell.expand') : t('shell.collapse')}
          className={`flex items-center gap-3 rounded-lg py-2 text-[13px] text-ink-muted hover:bg-surface hover:text-ink ${
            collapsed ? 'justify-center px-0' : 'px-3'
          }`}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4 shrink-0" aria-hidden /> : <PanelLeftClose className="h-4 w-4 shrink-0" aria-hidden />}
          {!collapsed && <span>{t('shell.collapse')}</span>}
        </button>
      </div>
    </aside>
  );
}
