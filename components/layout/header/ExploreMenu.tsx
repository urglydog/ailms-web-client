'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Briefcase, ChevronDown, Code, Info, Languages, Palette, Users, Video } from 'lucide-react';
import type { Category } from '@/types/domain';
import { isNavItemActive } from './navModel';

interface ExploreMenuProps {
  categories: Category[];
  liveNow: boolean;
}

const ROW =
  'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-ink no-underline hover:bg-tint hover:text-accent-dark';

const CATEGORY_ICONS = [Code, Languages, Briefcase, Palette] as const;

function CategoryIcon({ index }: { index: number }) {
  const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length] ?? Code;
  return <Icon size={16} aria-hidden className="text-accent" />;
}

/** Nút "Khám phá" + bảng 2 cột (spec mục 5): danh mục (từ API) và Live/Cộng đồng/Về chúng tôi.
 * Mở khi rê chuột hoặc bấm; đóng khi rời chuột, nhấn Escape hoặc chọn một liên kết. */
export function ExploreMenu({ categories, liveNow }: ExploreMenuProps) {
  const t = useTranslations('header');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = isNavItemActive(pathname, '/courses');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-md px-2.5 py-2 text-sm font-semibold transition-colors duration-150 ${
          active || open ? 'bg-tint text-accent-dark' : 'text-ink hover:bg-tint'
        }`}
      >
        {t('nav.explore')}
        <ChevronDown size={14} aria-hidden className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[200] grid w-[400px] grid-cols-2 gap-4 rounded-panel border border-line bg-surface-raised p-4 shadow-card-hover">
          <div>
            <p className="mb-1.5 px-2 text-[11px] font-medium tracking-wide text-ink-muted">{t('explore.categories')}</p>
            <Link href="/courses" onClick={() => setOpen(false)} className={ROW}>
              <Languages size={16} aria-hidden className="text-accent" />
              {t('explore.allCourses')}
            </Link>
            {categories.map((c, i) => (
              <Link
                key={c.id}
                href={`/courses?category=${c.slug}`}
                onClick={() => setOpen(false)}
                className={ROW}
              >
                <CategoryIcon index={i} />
                {c.name}
              </Link>
            ))}
          </div>
          <div>
            <p className="mb-1.5 px-2 text-[11px] font-medium tracking-wide text-ink-muted">{t('explore.more')}</p>
            <Link href="/live" onClick={() => setOpen(false)} className={ROW}>
              <Video size={16} aria-hidden className="text-accent" />
              {t('nav.live')}
              {liveNow && (
                <span className="ml-auto rounded-full bg-danger px-2 text-[11px] font-medium text-white">
                  {t('explore.liveNow')}
                </span>
              )}
            </Link>
            <Link href="/community" onClick={() => setOpen(false)} className={ROW}>
              <Users size={16} aria-hidden className="text-accent" />
              {t('nav.community')}
            </Link>
            <Link href="/about" onClick={() => setOpen(false)} className={ROW}>
              <Info size={16} aria-hidden className="text-accent" />
              {t('nav.about')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
