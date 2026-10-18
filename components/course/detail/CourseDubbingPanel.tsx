'use client';

import { Languages } from 'lucide-react';
import { useTranslations } from 'next-intl';

/** Khối nhấn mạnh điểm khác biệt của nền tảng: học bằng giọng lồng tiếng AI theo ngôn ngữ của mình. */
export function CourseDubbingPanel({ languages }: { languages: string[] }) {
  const t = useTranslations('courseDetail.dubPanel');
  if (languages.length === 0) return null;

  return (
    <section className="rounded-panel border border-line bg-surface p-5">
      <div className="mb-2 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
          <Languages size={18} aria-hidden />
        </span>
        <h2 className="m-0 font-display text-lg font-bold text-ink">{t('title')}</h2>
      </div>
      <p className="m-0 mb-3 text-sm leading-relaxed text-ink-muted">{t('body')}</p>
      <div className="flex flex-wrap gap-2">
        {languages.map((lang) => (
          <span key={lang} className="rounded-full border border-line bg-white px-3 py-1 text-[13px] font-semibold text-accent-dark">
            {lang}
          </span>
        ))}
      </div>
    </section>
  );
}
