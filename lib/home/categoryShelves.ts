import type { Category, CourseSummary } from '@/types/domain';

export interface CategoryShelfData {
  slug: string;
  name: string;
  courses: CourseSummary[];
}

/** Số khóa tối thiểu để một danh mục có kệ riêng trên trang chủ (ít hơn thì chỉ hiện ở lưới chủ đề). */
export const MIN_COURSES_PER_CATEGORY_SHELF = 3;
export const MAX_CATEGORY_SHELVES = 8;

/**
 * Ghép danh mục với danh sách khóa của nó rồi chọn các kệ để hiện trên trang chủ: bỏ danh mục quá ít khóa,
 * danh mục nhiều khóa nhất lên trước (hòa thì giữ thứ tự gốc), tối đa {@link MAX_CATEGORY_SHELVES} kệ.
 */
export function pickCategoryShelves(categories: Category[], coursesByCategory: CourseSummary[][]): CategoryShelfData[] {
  return categories
    .map((c, i) => ({ slug: c.slug, name: c.name, courses: coursesByCategory[i] ?? [], order: i }))
    .filter((s) => s.courses.length >= MIN_COURSES_PER_CATEGORY_SHELF)
    .sort((a, b) => b.courses.length - a.courses.length || a.order - b.order)
    .slice(0, MAX_CATEGORY_SHELVES)
    .map(({ slug, name, courses }) => ({ slug, name, courses }));
}
