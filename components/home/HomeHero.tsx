'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { HeroDemo } from './HeroDemo';

/** Hero chia đôi (spec mục 4): thông điệp bên trái (cụm "ngôn ngữ của bạn" tô vàng liền mạch),
 * video demo 3 cảnh bên phải. Nền `surface`. */
export function HomeHero() {
  const t = useTranslations('home.hero');

  return (
    <section className="border-b border-line bg-surface">
      <div className="shell grid items-center gap-10 py-12 lg:grid-cols-[1fr_1.15fr] lg:py-16">
        <div className="flex flex-col items-start gap-4">
          <span className="rounded-full bg-tint px-3 py-1 text-xs font-medium text-accent-dark">{t('tag')}</span>
          <h1 className="m-0 font-display text-[32px] font-semibold leading-[1.35] text-ink sm:text-[36px]">
            {t('titleBefore')}
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
