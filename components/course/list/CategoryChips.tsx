'use client';

import { useTranslations } from 'next-intl';
import { Chip } from '@/components/ui/Chip';
import type { Category } from '@/types/domain';

interface CategoryChipsProps {
  categories: Category[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

/** Hàng chip danh mục ở đầu trang Kho khóa học để lọc nhanh bằng một lần bấm. */
export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  const t = useTranslations('courseList');
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip active={selected === null} onClick={() => onSelect(null)}>
        {t('all')}
      </Chip>
      {categories.map((c) => (
        <Chip key={c.id} active={selected === c.slug} onClick={() => onSelect(c.slug)}>
          {c.name}
        </Chip>
      ))}
    </div>
  );
}
