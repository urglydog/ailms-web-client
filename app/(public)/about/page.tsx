'use client';

import { useTranslations } from 'next-intl';

const VALUE_KEYS = ['v1', 'v2', 'v3'] as const;

export default function AboutPage() {
  const t = useTranslations('pages.about');
  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-14">
      <h1 className="m-0 font-display text-[28px] font-bold text-ink">{t('title')}</h1>
      <p className="mt-3 text-[15px] leading-[1.7] text-ink-muted">{t('intro')}</p>

      <div className="mt-10 flex flex-col gap-6">
        {VALUE_KEYS.map((k) => (
          <div key={k} className="rounded-card border border-line bg-surface-raised p-5 shadow-card">
            <h2 className="m-0 font-display text-[16px] font-semibold text-ink">{t(`${k}Title`)}</h2>
            <p className="mt-1.5 text-[14px] leading-[1.6] text-ink-muted">{t(`${k}Desc`)}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-[13px] text-ink-faint">{t('footer')}</p>
    </div>
  );
}
