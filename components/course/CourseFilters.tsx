'use client';

import { useRouter } from 'next/navigation';
import { Pill } from '@/components/ui/Pill';
import { EMPTY_FILTERS } from '@/lib/api/publicCourses';
import type { Category, CourseFilterState } from '@/types/domain';

/**
 * Ba nhóm bộ lọc của UC09: danh mục, trình độ, loại giá.
 *
 * Không có bộ lọc ngôn ngữ lồng tiếng: chưa có dữ liệu lồng tiếng thật gắn với khóa
 * học nào (AudioTrack/VoiceMapping thuộc Giai đoạn 5) — lọc theo ngôn ngữ lúc này sẽ
 * là bộ lọc giả không có dữ liệu thật. Bổ sung khi Giai đoạn 5 có dữ liệu.
 *
 * `categories` nhận qua prop (gọi `useCategories()` ở component cha) thay vì import
 * thẳng dữ liệu mock, để danh mục hiển thị đúng dữ liệu thật từ Admin quản lý.
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
  categories: Category[];
}

export function CourseFilters({ filters, onChange, categories }: CourseFiltersProps) {
  const router = useRouter();

  /** Bấm lại giá trị đang chọn thì bỏ chọn — đỡ phải có nút "xoá lọc" riêng cho từng nhóm. */
  const toggle = <K extends keyof CourseFilterState>(key: K, value: CourseFilterState[K]) => {
    onChange({ ...filters, [key]: filters[key] === value ? null : value });
  };

  const hasActiveFilter =
    filters.category !== null ||
    filters.level !== null ||
    filters.priceType !== 'all' ||
    filters.keyword.trim() !== '';

  const clearFilters = () => {
    onChange(EMPTY_FILTERS);
    router.push('/courses');
  };

  return (
    <aside className="flex flex-col gap-6" aria-label="Bộ lọc khoá học">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-bold text-ink">Bộ lọc</span>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[13px] font-semibold text-accent underline-offset-4 hover:underline"
          >
            Xoá bộ lọc
          </button>
        )}
      </div>

      <FilterGroup label="Danh mục">
        {categories.map((cat) => (
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
