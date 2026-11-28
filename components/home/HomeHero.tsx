'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { HeroDemo } from './HeroDemo';

/** Hero chia đôi (spec mục 4): thông điệp bên trái (cụm "ngôn ngữ của bạn" tô vàng liền mạch),
 * video demo 3 cảnh bên phải. Nền `surface`. */
/**
 * `mascot`: chỗ chờ sẵn cho linh vật Lingo (UDEMY_LAYOUT_ANALYSIS mục 7, bước 6) — chưa truyền thì không vẽ gì.
 */
export function HomeHero({ mascot }: { mascot?: ReactNode } = {}) {
  const t = useTranslations('home.hero');

  return (
    <section className="border-b border-line bg-surface">
      <div className="shell grid grid-cols-[minmax(0,1fr)] items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_1.15fr] lg:py-16">
        <div className="relative flex flex-col items-start gap-4">
          {mascot && <div data-slot="mascot" className="mb-2">{mascot}</div>}
          <span className="rounded-full bg-tint px-3 py-1 text-xs font-medium text-accent-dark">{t('tag')}</span>
          <h1 className="m-0 font-display text-[32px] font-semibold leading-[1.35] text-ink sm:text-[36px]">
            {t('titleBefore')}{' '}
            <br />
            <mark className="inline-block whitespace-nowrap rounded-md bg-highlight px-2.5 text-ink">
              {t('titleHighlight')}
            </mark>
          </h1>
          <p className="m-0 max-w-[48ch] text-[15px] leading-[1.65] text-ink-muted">{t('description')}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link
              href="/courses"
              className="btn-tactile inline-flex items-center whitespace-nowrap rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
            >
              {t('cta')}
            </Link>
            <Link
              href="#demo"
              className="whitespace-nowrap rounded-md px-3 py-3 text-sm font-semibold text-accent-dark no-underline hover:bg-tint"
            >
              {t('demoLink')}
            </Link>
          </div>
        </div>

        <div id="demo" className="scroll-mt-24">
          <HeroDemo />
        </div>
      </div>
    </section>
  );
}
