import Link from 'next/link';
import { Bot, Languages, Route } from 'lucide-react';
import { useTranslations } from 'next-intl';

const FEATURES = [
  { key: 'dubbing', Icon: Languages },
  { key: 'tutor', Icon: Bot },
  { key: 'plan', Icon: Route },
] as const;

/**
 * Khối tối giới thiệu 3 tính năng AI (lồng tiếng, gia sư, lộ trình). Nền `night` cố định tối ở cả hai
 * chế độ nên chữ luôn trắng; cyan dành riêng cho lồng tiếng (DESIGN_RULES mục 1.6).
 */
export function HomeAiFeatures() {
  const t = useTranslations('home.ai');
  return (
    <section className="bg-night text-white" aria-labelledby="home-ai-title">
      <div className="shell section-block">
        <h2 id="home-ai-title" className="m-0 font-display text-2xl font-bold leading-tight text-white lg:text-[30px]">
          {t('title')}
        </h2>
        <p className="m-0 mt-2 max-w-[60ch] text-[15px] text-white/75">{t('subtitle')}</p>
        <ul className="m-0 mt-8 grid list-none gap-5 p-0 md:grid-cols-3">
          {FEATURES.map(({ key, Icon }) => (
            <li key={key} className="rounded-card border border-white/15 bg-white/5 p-5">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-control ${
                  key === 'dubbing' ? 'bg-cyan text-cyan-ink' : 'bg-white/10 text-white'
                }`}
              >
                <Icon size={20} aria-hidden />
              </span>
              <h3 className="m-0 mt-4 font-display text-lg font-semibold text-white">{t(`${key}.title`)}</h3>
              <p className="m-0 mt-1.5 text-sm leading-relaxed text-white/75">{t(`${key}.body`)}</p>
            </li>
          ))}
        </ul>
        <Link
          href="/courses"
          className="btn-tactile mt-8 inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
        >
          {t('cta')}
        </Link>
      </div>
    </section>
  );
}
