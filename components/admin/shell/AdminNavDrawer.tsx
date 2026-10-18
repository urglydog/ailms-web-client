'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ADMIN_NAV_GROUPS, activeAdminItem } from '@/lib/admin/nav';
import { ADMIN_NAV_ICONS } from './navIcons';

interface AdminNavDrawerProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
  pendingCourses: number;
}

/** Ngăn kéo điều hướng khu Quản trị cho điện thoại: trượt từ trái, khóa cuộn nền, đóng bằng Escape/nền mờ/nút đóng. */
export function AdminNavDrawer({ open, onClose, pathname, pendingCourses }: AdminNavDrawerProps) {
  const t = useTranslations('admin');
  const closeRef = useRef<HTMLButtonElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const id = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow === 'hidden' ? '' : previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  const active = activeAdminItem(pathname);

  return (
    <div className="fixed inset-0 z-[250] md:hidden">
      <div
        data-testid="drawer-overlay"
        onClick={onClose}
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${shown ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('shell.menuTitle')}
        className={`absolute inset-y-0 left-0 flex w-[min(86vw,320px)] flex-col bg-white shadow-card-hover transition-transform duration-200 ease-soft ${
          shown ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-display text-base font-bold text-white" aria-hidden>
              L
            </span>
            <span className="font-display text-sm font-bold text-ink">{t('shell.role')}</span>
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('shell.closeMenu')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink hover:bg-tint"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <nav aria-label={t('nav.aria')} className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
          {ADMIN_NAV_GROUPS.map((group, gi) => (
            <div key={group.id} className={gi === 0 ? '' : 'mt-3'}>
              {group.id !== 'main' && (
                <div className="px-3 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">{t(`nav.groups.${group.id}`)}</div>
              )}
              {group.items.map((item) => {
                const isActive = active?.id === item.id;
                const Icon = ADMIN_NAV_ICONS[item.id];
                const badge = item.id === 'moderation' ? pendingCourses : 0;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold no-underline ${
                      isActive ? 'bg-tint text-accent-dark' : 'text-ink hover:bg-surface'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{t(`nav.${item.id}`)}</span>
                    {badge > 0 && (
                      <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10.5px] font-bold text-white">{badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-line px-3 py-3">
          <Link href="/" onClick={onClose} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-muted no-underline hover:bg-surface hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t('shell.backToStudent')}
          </Link>
        </div>
      </div>
    </div>
  );
}
