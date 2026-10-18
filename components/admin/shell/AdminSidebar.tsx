'use client';

import Link from 'next/link';
import { ArrowLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ADMIN_NAV_GROUPS, activeAdminItem } from '@/lib/admin/nav';
import { ADMIN_NAV_ICONS } from './navIcons';

interface AdminSidebarProps {
  pathname: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Số khóa chờ duyệt, hiện thành chấm số cạnh mục Kiểm duyệt. */
  pendingCourses: number;
}

/** Thanh bên sáng của khu Quản trị (từ `md`): nhãn luôn hiện, chia nhóm có tiêu đề, thu gọn được thành cột icon. */
export function AdminSidebar({ pathname, collapsed, onToggleCollapsed, pendingCourses }: AdminSidebarProps) {
  const t = useTranslations('admin');
  const active = activeAdminItem(pathname);

  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-white transition-[width] duration-200 ease-out md:flex ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      <div className={`flex h-16 shrink-0 items-center gap-2.5 border-b border-line-soft ${collapsed ? 'justify-center' : 'px-5'}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-display text-base font-bold text-white" aria-hidden>
          L
        </span>
        {!collapsed && (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-display text-[15px] font-bold text-ink">{t('shell.brand')}</span>
            <span className="text-[11px] font-medium text-ink-muted">{t('shell.role')}</span>
          </span>
        )}
      </div>

      <nav aria-label={t('nav.aria')} className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {ADMIN_NAV_GROUPS.map((group, gi) => (
          <div key={group.id} className={gi === 0 ? '' : 'mt-3'}>
            {group.id !== 'main' &&
              (collapsed ? (
                <div className="mx-3 mb-1.5 border-t border-line-soft" aria-hidden />
              ) : (
                <div className="px-3 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">{t(`nav.groups.${group.id}`)}</div>
              ))}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = active?.id === item.id;
                const Icon = ADMIN_NAV_ICONS[item.id];
                const label = t(`nav.${item.id}`);
                const badge = item.id === 'moderation' ? pendingCourses : 0;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    title={collapsed ? label : undefined}
                    aria-label={collapsed ? label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex items-center gap-3 rounded-lg py-2.5 text-[13.5px] font-semibold no-underline transition-colors ${
                      collapsed ? 'justify-center px-0' : 'px-3'
                    } ${isActive ? 'bg-tint text-accent-dark' : 'text-ink-muted hover:bg-surface hover:text-ink'}`}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
                    {badge > 0 && (
                      <span
                        className={
                          collapsed
                            ? 'absolute right-1.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white'
                            : 'flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-danger px-1 text-[10.5px] font-bold text-white'
                        }
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
