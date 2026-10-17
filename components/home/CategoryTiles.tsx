'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCategories } from '@/hooks/useCategories';

/** Lưới "Khám phá theo chủ đề": mỗi danh mục là một ô có ảnh minh họa, dẫn tới danh sách khóa theo danh mục. */
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
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/courses?category=${c.slug}`}
              className="group relative block aspect-[4/3] overflow-hidden rounded-panel no-underline hover:no-underline"
            >
              <Image
                src={`https://picsum.photos/seed/lms-topic-${c.slug}/480/360`}
                alt=""
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" aria-hidden />
              <span className="absolute inset-x-0 bottom-0 p-3 font-display text-sm font-semibold text-white">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
