'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { BookOpen, Radio, Search, Users, Info, X, Library } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Category } from '@/types/domain';
import { isNavItemActive } from './navModel';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  isLoggedIn: boolean;
  liveNow: boolean;
  pathname: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
}

const ITEM = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold no-underline';

/** Ngăn kéo menu cho điện thoại: trượt từ trái, có nền mờ, khóa cuộn trang nền, đóng bằng Escape, bấm nền mờ hoặc nút đóng.
 * Gộp ô tìm kiếm, "Khám phá" (tất cả khóa học và từng danh mục), các mục chính và lối đăng nhập; thay cho panel xổ xuống cũ. */
export function MobileDrawer({
  open,
  onClose,
  categories,
  isLoggedIn,
  liveNow,
  pathname,
  search,
  onSearchChange,
  onSearchSubmit,
}: MobileDrawerProps) {
  const t = useTranslations('header');
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
    const onKey = (e: globalThis.KeyboardEvent) => {
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

  const active = (href: string) => isNavItemActive(pathname, href);
  const linkClass = (href: string) => `${ITEM} ${active(href) ? 'bg-tint text-accent-dark' : 'text-ink hover:bg-surface'}`;
  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearchSubmit();
  };

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
        aria-label={t('mobileMenu.title')}
        className={`absolute inset-y-0 left-0 flex w-[min(86vw,340px)] flex-col bg-white shadow-card-hover transition-transform duration-200 ease-soft ${
          shown ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="font-display text-base font-bold text-ink">LinguaLearn</span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('mobileMenu.close')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink hover:bg-tint"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5">
            <button type="button" onClick={onSearchSubmit} aria-label={t('search.ariaLabel')} className="flex shrink-0 items-center text-ink-muted">
              <Search size={16} aria-hidden />
            </button>
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder={t('search.placeholder')}
              aria-label={t('search.ariaLabel')}
              className="w-full min-w-0 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-muted"
            />
          </div>

          <p className="m-0 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{t('nav.explore')}</p>
          <nav className="mb-4 flex flex-col gap-0.5" aria-label={t('nav.explore')}>
            <Link href="/courses" onClick={onClose} className={linkClass('/courses')}>
              <Library size={17} aria-hidden className="text-accent" />
              {t('explore.allCourses')}
            </Link>
            {categories.map((c) => (
              <Link key={c.id} href={`/courses?category=${c.slug}`} onClick={onClose} className={`${ITEM} pl-10 font-medium text-ink hover:bg-surface`}>
                {c.name}
              </Link>
            ))}
          </nav>

          <nav className="flex flex-col gap-0.5" aria-label={t('explore.more')}>
            {isLoggedIn && (
              <Link href="/my-courses" onClick={onClose} className={linkClass('/my-courses')}>
                <BookOpen size={17} aria-hidden className="text-accent" />
                {t('nav.myCourses')}
              </Link>
            )}
            <Link href="/live" onClick={onClose} className={linkClass('/live')}>
              <Radio size={17} aria-hidden className="text-accent" />
              {t('nav.live')}
              {liveNow && <span aria-hidden className="h-2 w-2 rounded-full bg-danger" />}
            </Link>
            <Link href="/community" onClick={onClose} className={linkClass('/community')}>
              <Users size={17} aria-hidden className="text-accent" />
              {t('nav.community')}
            </Link>
            <Link href="/about" onClick={onClose} className={linkClass('/about')}>
              <Info size={17} aria-hidden className="text-accent" />
              {t('nav.about')}
            </Link>
          </nav>
        </div>

        {!isLoggedIn && (
          <div className="flex gap-2 border-t border-line px-4 py-3">
            <Link
              href="/login"
              onClick={onClose}
              className="flex-1 rounded-md border border-accent px-3 py-2 text-center text-sm font-semibold text-accent-dark no-underline hover:bg-tint"
            >
              {t('auth.login')}
            </Link>
            <Link
              href="/register"
              onClick={onClose}
              className="flex-1 rounded-md bg-accent px-3 py-2 text-center text-sm font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
            >
              {t('auth.getStarted')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
