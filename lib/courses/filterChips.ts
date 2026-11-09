import type { Category, CourseFilterState } from '@/types/domain';

export type FilterKey = 'keyword' | 'category' | 'level' | 'priceType' | 'minRating' | 'durationBucket';

/** Một bộ lọc đang bật, hiện thành chip. `kind` cho biết cách dịch nhãn; `value` là giá trị thô hoặc tên đã sẵn. */
export interface FilterChip {
  key: FilterKey;
  kind: 'keyword' | 'text' | 'level' | 'price' | 'rating' | 'duration';
  value: string;
}

/** Các bộ lọc đang bật, theo thứ tự: từ khóa, danh mục, cấp độ, học phí, đánh giá, thời lượng. */
export function activeFilterChips(filters: CourseFilterState, categories: Category[]): FilterChip[] {
  const chips: FilterChip[] = [];
  if (filters.keyword.trim() !== '') chips.push({ key: 'keyword', kind: 'keyword', value: filters.keyword.trim() });
  if (filters.category !== null) {
    const name = categories.find((c) => c.slug === filters.category)?.name ?? filters.category;
    chips.push({ key: 'category', kind: 'text', value: name });
  }
  if (filters.level !== null) chips.push({ key: 'level', kind: 'level', value: filters.level });
  if (filters.priceType !== 'all') chips.push({ key: 'priceType', kind: 'price', value: filters.priceType });
  if (filters.minRating !== null) chips.push({ key: 'minRating', kind: 'rating', value: String(filters.minRating) });
  if (filters.durationBucket !== null) chips.push({ key: 'durationBucket', kind: 'duration', value: filters.durationBucket });
  return chips;
}

/** Bỏ đúng một bộ lọc, giữ nguyên các bộ lọc còn lại. */
export function clearFilter(filters: CourseFilterState, key: FilterKey): CourseFilterState {
  switch (key) {
    case 'keyword':
      return { ...filters, keyword: '' };
    case 'priceType':
      return { ...filters, priceType: 'all' };
    default:
      return { ...filters, [key]: null };
  }
}
