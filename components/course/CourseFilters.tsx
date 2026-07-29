'use client';

import { Pill } from '@/components/ui/Pill';
import { MOCK_CATEGORIES, MOCK_LANGUAGES, type CourseFilterState } from '@/lib/mock/courses';

/**
 * Bốn nhóm bộ lọc của UC09: danh mục, trình độ, loại giá, ngôn ngữ lồng tiếng.
 *
 * Giai đoạn 2 sẽ đẩy các giá trị này thành query param gửi lên backend thay vì lọc
 * ở client, và đồng bộ với URL để chia sẻ được đường dẫn đã lọc.
 */

const LEVELS = [
  { value: 'BEGINNER', label: 'Cơ bản' },
  { value: 'INTERMEDIATE', label: 'Trung cấp' },
  { value: 'ADVANCED', label: 'Nâng cao' },
] as const;

const PRICE_TYPES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'free', label: 'Miễn phí' },
  { value: 'paid', label: 'Trả phí' },
] as const;

interface CourseFiltersProps {
  filters: CourseFilterState;
  onChange: (next: CourseFilterState) => void;
}

export function CourseFilters({ filters, onChange }: CourseFiltersProps) {
  /** Bấm lại giá trị đang chọn thì bỏ chọn — đỡ phải có nút "xoá lọc" riêng. */
  const toggle = <K extends keyof CourseFilterState>(key: K, value: CourseFilterState[K]) => {
    onChange({ ...filters, [key]: filters[key] === value ? null : value });
  };

  return (
    <aside className="flex flex-col gap-6" aria-label="Bộ lọc khoá học">
      <FilterGroup label="Danh mục">
        {MOCK_CATEGORIES.map((cat) => (
          <Pill
            key={cat.slug}
            active={filters.category === cat.slug}
            onClick={() => toggle('category', cat.slug)}
          >
            {cat.name}
          </Pill>
        ))}
      </FilterGroup>

      <FilterGroup label="Trình độ">
        {LEVELS.map((lv) => (
          <Pill key={lv.value} active={filters.level === lv.value} onClick={() => toggle('level', lv.value)}>
            {lv.label}
          </Pill>
        ))}
      </FilterGroup>

      <FilterGroup label="Học phí">
        {PRICE_TYPES.map((p) => (
          <Pill
            key={p.value}
            active={filters.priceType === p.value}
            onClick={() => onChange({ ...filters, priceType: p.value })}
          >
            {p.label}
          </Pill>
        ))}
      </FilterGroup>

      <FilterGroup label="Ngôn ngữ lồng tiếng">
        {MOCK_LANGUAGES.map((lang) => (
          <Pill key={lang.code} active={filters.lang === lang.code} onClick={() => toggle('lang', lang.code)}>
            <span aria-hidden>{lang.flag}</span>
            {lang.label}
          </Pill>
        ))}
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-1 font-display text-sm font-bold text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
