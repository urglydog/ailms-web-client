'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Category } from '@/types/domain';

/**
 * Thanh danh mục dạng chữ mỏng ngay dưới header (UDEMY_LAYOUT_ANALYSIS mục 8): một dòng điều
 * hướng, cuộn ngang trên màn hẹp — không phải khối thẻ lớn giữa trang.
 */
export function HomeCategoryBar({ categories }: { categories: Category[] }) {
  const t = useTranslations('home.categoryBar');
  if (categories.length === 0) return null;
  return (
    <nav aria-label={t('label')} className="border-b border-line-soft bg-surface-raised">
      <ul className="shell m-0 flex list-none gap-6 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] md:justify-center">
        {categories.map((c) => (
          <li key={c.id} className="shrink-0">
            <Link
              href={`/courses?category=${encodeURIComponent(c.slug)}`}
              className="text-sm text-ink-muted no-underline transition-colors hover:text-ink hover:underline focus-visible:text-ink motion-reduce:transition-none"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
