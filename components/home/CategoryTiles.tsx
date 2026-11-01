'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  BarChart3, BrainCircuit, Cloud, Code2, Folder, Gamepad2, Languages, PenTool, ShieldCheck, Smartphone, Table2, Users, Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCategories } from '@/hooks/useCategories';
import { categoryVisual, type CategoryIcon } from '@/lib/home/categoryVisual';

const ICONS: Record<CategoryIcon, LucideIcon> = {
  code: Code2,
  chart: BarChart3,
  brain: BrainCircuit,
  design: PenTool,
  language: Languages,
  game: Gamepad2,
  mobile: Smartphone,
  cloud: Cloud,
  shield: ShieldCheck,
  wallet: Wallet,
  sheet: Table2,
  users: Users,
  folder: Folder,
};

/** Lưới "Khám phá theo chủ đề": mỗi danh mục là một ô có hình minh họa đúng chủ đề, dẫn tới danh sách khóa theo danh mục. */
export function CategoryTiles() {
  const t = useTranslations('home.topics');
  const { data: categories } = useCategories();
  if (!categories || categories.length === 0) return null;

  return (
    <section className="bg-surface-raised">
      <div className="shell py-10">
        <h2 className="m-0 font-display text-lg font-semibold text-ink">{t('title')}</h2>
        <p className="m-0 mb-4 mt-0.5 text-sm text-ink-muted">{t('subtitle')}</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => {
            const visual = categoryVisual(c.slug, c.id);
            const Icon = ICONS[visual.icon];
            return (
              <Link
                key={c.id}
                href={`/courses?category=${c.slug}`}
                className={`group relative block aspect-[4/3] overflow-hidden rounded-panel bg-gradient-to-br ${visual.gradient} no-underline hover:no-underline`}
              >
                {visual.image ? (
                  <Image
                    src={visual.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <Icon
                    aria-hidden
                    strokeWidth={1.25}
                    className="absolute -right-4 -top-4 h-28 w-28 text-white/20 transition-transform duration-300 group-hover:scale-110"
                  />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" aria-hidden />
                <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-sm">
                  <Icon aria-hidden className="h-[18px] w-[18px]" />
                </span>
                <span className="absolute inset-x-0 bottom-0 p-3 font-display text-sm font-semibold text-white">
                  {c.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
