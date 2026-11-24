'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LearnTitleProvider, useLearnTitle, useLearnProgress } from '@/components/layout/LearnTitleContext';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { getAccessToken } from '@/lib/auth/token';

/**
 * Header mỏng của trang học (UDEMY_LAYOUT_ANALYSIS mục 5): ← | logo | tên khóa | vòng tiến độ % | ⋮.
 * Không dùng `<Header>` đầy đủ để nhường chiều dọc cho video. Khách xem thử thì nút ← về kho khóa học.
 */
function LearnMenu() {
  const t = useTranslations('learn.header');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const item =
    'block rounded-md px-3 py-2 text-[13px] text-ink no-underline hover:bg-tint hover:text-ink hover:no-underline';

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('menu')}
        className="flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:bg-tint hover:text-ink"
      >
        <MoreVertical size={18} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-56 rounded-card border border-line bg-surface-raised p-1 shadow-card-hover">
          <Link role="menuitem" href="/my-courses" className={item} onClick={() => setOpen(false)}>
            {t('back')}
          </Link>
          <Link role="menuitem" href="/courses" className={item} onClick={() => setOpen(false)}>
            {t('browse')}
          </Link>
          <Link role="menuitem" href="/help" className={item} onClick={() => setOpen(false)}>
            {t('help')}
          </Link>
        </div>
      )}
    </div>
  );
}

function LearnHeaderBar() {
  const t = useTranslations('learn.header');
  const courseTitle = useLearnTitle();
  const progressPct = useLearnProgress();
  // Đọc token sau khi gắn kết để HTML máy chủ (không có token) khớp lần render đầu của trình duyệt.
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    setLoggedIn(!!getAccessToken());
  }, []);

  return (
    <div className="sticky top-0 z-30 border-b border-line bg-surface-raised">
      <div className="mx-auto flex h-12 max-w-[1800px] items-center gap-2 px-2 md:gap-3 md:px-6">
        <Link
          href={loggedIn ? '/my-courses' : '/courses'}
          className="flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-1 rounded-md px-1.5 py-1 text-[13px] font-medium text-ink-muted no-underline hover:bg-tint hover:text-ink hover:no-underline"
        >
          <ArrowLeft size={16} aria-hidden />
          <span className="sr-only">{loggedIn ? t('back') : t('browse')}</span>
        </Link>
        <Link href="/" aria-label="LinguaLearn" className="flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-2 no-underline">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-accent font-display text-[13px] font-bold text-white">
            L
          </span>
          <span className="sr-only whitespace-nowrap font-display text-[14px] font-bold text-ink md:not-sr-only">
            LinguaLearn
          </span>
        </Link>
        {courseTitle && (
          <>
            <span className="hidden h-5 w-px shrink-0 bg-line sm:block" aria-hidden />
            <span className="min-w-0 truncate text-[14px] font-semibold text-ink">{courseTitle}</span>
          </>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {progressPct !== null && (
            <span className="flex items-center gap-2 pr-1">
              <ProgressRing value={progressPct} label={t('progress')} />
              <span className="hidden whitespace-nowrap text-[12px] font-medium text-ink-muted md:inline">
                {t('progress')}
              </span>
            </span>
          )}
          {loggedIn && <LearnMenu />}
        </div>
      </div>
    </div>
  );
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <LearnTitleProvider>
      <div className="flex min-h-dvh flex-col">
        <LearnHeaderBar />
        <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      </div>
    </LearnTitleProvider>
  );
}
