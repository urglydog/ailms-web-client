'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, Globe, LogOut, Menu, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NotificationMenu } from '@/components/layout/header/NotificationMenu';
import { useNotification } from '@/components/providers/NotificationProvider';

interface InstructorTopbarProps {
  /** Tên mục đang mở, hiện bên trái thanh trên. */
  title: string;
  user: { fullName: string; avatarUrl: string | null };
  onOpenMenu: () => void;
  onOpenLanguage: () => void;
  onLogout: () => void;
}

type Popover = 'notifications' | 'account' | null;

/** Thanh trên của Kênh giảng viên: tên mục, nút Tạo khóa học, chuông thông báo và menu tài khoản (ngôn ngữ, đăng xuất). */
export function InstructorTopbar({ title, user, onOpenMenu, onOpenLanguage, onLogout }: InstructorTopbarProps) {
  const t = useTranslations('instructor.shell');
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [open, setOpen] = useState<Popover>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  const initial = user.fullName.trim().charAt(0).toUpperCase() || 'G';
  const toggle = (which: Exclude<Popover, null>) => setOpen((cur) => (cur === which ? null : which));

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t('openMenu')}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink hover:bg-tint md:hidden"
      >
        <Menu size={20} aria-hidden />
      </button>

      <span className="min-w-0 flex-1 truncate font-display text-[15px] font-bold text-ink">{title}</span>

      <Link
        href="/instructor/courses/new"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13.5px] font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
      >
        <Plus size={16} aria-hidden />
        <span className="sr-only sm:not-sr-only">{t('createCourse')}</span>
      </Link>

      <div ref={rootRef} className="flex shrink-0 items-center gap-1">
        <div className="relative">
          <button
            type="button"
            onClick={() => toggle('notifications')}
            aria-expanded={open === 'notifications'}
            aria-haspopup="true"
            aria-label={`${t('notifications')}${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-tint"
          >
            <Bell size={18} aria-hidden />
            {unreadCount > 0 && (
              <span aria-hidden className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10.5px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {open === 'notifications' && (
            <div className="absolute right-0 top-full z-[200] pt-2">
              <NotificationMenu
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkRead={markAsRead}
                onMarkAllRead={markAllAsRead}
                onOpenLink={(url) => {
                  setOpen(null);
                  router.push(url);
                }}
              />
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggle('account')}
            aria-expanded={open === 'account'}
            aria-haspopup="menu"
            aria-label={t('account')}
            className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 hover:bg-tint"
          >
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent font-display text-[13px] font-bold text-white">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </span>
            <ChevronDown size={14} aria-hidden className="text-ink-muted" />
          </button>
          {open === 'account' && (
            <div role="menu" className="absolute right-0 top-full z-[200] mt-2 w-60 rounded-panel border border-line bg-white p-2 shadow-card-hover">
              <div className="border-b border-line-soft px-3 pb-2 pt-1">
                <div className="truncate text-sm font-semibold text-ink">{user.fullName}</div>
                <div className="text-xs text-ink-muted">{t('role')}</div>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(null);
                  onOpenLanguage();
                }}
                className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface"
              >
                <Globe size={16} aria-hidden className="text-accent" />
                {t('language')}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(null);
                  onLogout();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-surface"
              >
                <LogOut size={16} aria-hidden />
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
