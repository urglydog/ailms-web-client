'use client';

import { useTranslations } from 'next-intl';
import type { ProfileTab } from '@/lib/profile/model';

interface ProfileTabsProps {
  active: ProfileTab;
  certificateCount: number;
  onChange: (tab: ProfileTab) => void;
}

const ORDER: ProfileTab[] = ['certificates', 'courses', 'wishlist'];

export function ProfileTabs({ active, certificateCount, onChange }: ProfileTabsProps) {
  const t = useTranslations('profile.tabs');
  const moveFocus = (e: React.KeyboardEvent<HTMLButtonElement>, from: ProfileTab) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    e.preventDefault();
    const next = ORDER[(ORDER.indexOf(from) + step + ORDER.length) % ORDER.length]!;
    onChange(next);
    const buttons = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[ORDER.indexOf(next)]?.focus();
  };
  return (
    <div role="tablist" aria-label={t('certificates')} className="mb-6 flex gap-6 border-b border-line">
      {ORDER.map((tab) => {
        const selected = tab === active;
        const label = tab === 'certificates' && certificateCount > 0 ? `${t(tab)} (${certificateCount})` : t(tab);
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onKeyDown={(e) => moveFocus(e, tab)}
            onClick={() => onChange(tab)}
            className={`-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
              selected ? 'border-accent text-ink' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
