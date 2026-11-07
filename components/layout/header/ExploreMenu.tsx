'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Briefcase, ChevronDown, ChevronRight, Code, Info, Languages, Palette, Users, Video } from 'lucide-react';
import type { Category } from '@/types/domain';
import { groupCategories } from '@/lib/home/categoryGroups';
import type { CategoryGroup } from '@/lib/home/categoryGroups';
import { isNavItemActive } from './navModel';

interface ExploreMenuProps {
  categories: Category[];
  liveNow: boolean;
}

const ROW =
  'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-ink no-underline hover:bg-tint hover:text-accent-dark';

const TILE =
  'flex items-center gap-2 rounded-md px-2 py-2 text-[13px] leading-snug text-ink no-underline hover:bg-tint hover:text-accent-dark';

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
  // `pinned`: người dùng đã bấm nên menu giữ mở dù rời chuột (rê chuột chỉ mở tạm). Nếu không
  // phân biệt, rê chuột rồi bấm sẽ đảo trạng thái và đóng menu ngay.
  const [pinned, setPinned] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const active = isNavItemActive(pathname, '/courses');
  const groups = groupCategories(categories);
  const tabs: (CategoryGroup | 'more')[] = [...groups.map((g) => g.group), 'more'];
  const [activeTab, setActiveTab] = useState<CategoryGroup | 'more' | null>(null);
  // Danh mục tải bất đồng bộ nên chưa chọn gì thì mặc định nhóm đầu tiên hiện có.
  const current = activeTab && tabs.includes(activeTab) ? activeTab : (tabs[0] ?? 'more');

  const close = () => {
    setActiveTab(null);
    setOpen(false);
    setPinned(false);
  };

  const handleClick = () => {
    if (open && !pinned) {
      setPinned(true);
      return;
    }
    if (open) {
      close();
      return;
    }
    setOpen(true);
    setPinned(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerRef.current?.focus();
        setOpen(false);
        setPinned(false);
      }
    };
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPinned(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!pinned) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={handleClick}
        className={`flex items-center gap-1 rounded-md px-2.5 py-2 text-sm font-semibold transition-colors duration-150 ${
          active || open ? 'bg-tint text-accent-dark' : 'text-ink hover:bg-tint'
        }`}
      >
        {t('nav.explore')}
        <ChevronDown size={14} aria-hidden className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[200] flex w-[min(680px,92vw)] overflow-hidden rounded-panel border border-line bg-surface-raised shadow-card-hover">
          {/* Cột trái: nhóm danh mục + "Khám phá thêm". Rê chuột hoặc bấm để đổi nhóm đang xem. */}
          <div className="w-[200px] shrink-0 border-r border-line-soft bg-tint/40 p-2">
            <Link href="/courses" onClick={close} className={ROW}>
              <Languages size={16} aria-hidden className="text-accent" />
              {t('explore.allCourses')}
            </Link>
            <p className="mb-1 mt-3 px-2 text-[11px] font-medium tracking-wide text-ink-muted">{t('explore.categories')}</p>
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={current === tab}
                onMouseEnter={() => setActiveTab(tab)}
                onFocus={() => setActiveTab(tab)}
                onClick={() => setActiveTab(tab)}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-[13px] font-semibold transition-colors duration-150 ${
                  current === tab ? 'bg-surface-raised text-accent-dark shadow-sm' : 'text-ink hover:bg-surface-raised'
                } ${tab === 'more' ? 'mt-3' : ''}`}
              >
                {tab === 'more' ? t('explore.more') : t(`explore.groups.${tab}`)}
                <ChevronRight size={14} aria-hidden className="shrink-0 text-ink-muted" />
              </button>
            ))}
          </div>

          {/* Cột phải: mục của nhóm đang chọn, xếp ngang 3 cột rồi xuống dòng. */}
          <div className="min-w-0 flex-1 p-3">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {current === 'more' ? (
                <>
                  <Link href="/live" onClick={close} className={TILE}>
                    <Video size={16} aria-hidden className="shrink-0 text-accent" />
                    {t('nav.live')}
                    {liveNow && (
                      <span className="ml-auto rounded-full bg-danger px-2 text-[11px] font-medium text-white">
                        {t('explore.liveNow')}
                      </span>
                    )}
                  </Link>
                  <Link href="/community" onClick={close} className={TILE}>
                    <Users size={16} aria-hidden className="shrink-0 text-accent" />
                    {t('nav.community')}
                  </Link>
                  <Link href="/about" onClick={close} className={TILE}>
                    <Info size={16} aria-hidden className="shrink-0 text-accent" />
                    {t('nav.about')}
                  </Link>
                </>
              ) : (
                (groups.find((g) => g.group === current)?.items ?? []).map((c, i) => (
                  <Link key={c.id} href={`/courses?category=${c.slug}`} onClick={close} className={TILE}>
                    <CategoryIcon index={i} />
                    {c.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
