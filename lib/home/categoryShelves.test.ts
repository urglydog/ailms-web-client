import { describe, expect, it } from 'vitest';
import { MAX_CATEGORY_SHELVES, pickCategoryShelves } from './categoryShelves';
import type { Category, CourseSummary } from '@/types/domain';

const cat = (id: number, slug: string): Category => ({ id, name: slug.toUpperCase(), slug } as Category);
const courses = (n: number): CourseSummary[] => Array.from({ length: n }, (_, i) => ({ id: i + 1 } as CourseSummary));

describe('pickCategoryShelves', () => {
  it('bỏ danh mục có quá ít khóa', () => {
    const out = pickCategoryShelves([cat(1, 'a'), cat(2, 'b')], [courses(2), courses(5)]);
    expect(out.map((s) => s.slug)).toEqual(['b']);
  });

  it('danh mục nhiều khóa lên trước, hòa thì giữ thứ tự gốc', () => {
    const out = pickCategoryShelves([cat(1, 'a'), cat(2, 'b'), cat(3, 'c')], [courses(4), courses(8), courses(4)]);
    expect(out.map((s) => s.slug)).toEqual(['b', 'a', 'c']);
  });

  it('giới hạn số kệ hiển thị', () => {
    const cats = Array.from({ length: 12 }, (_, i) => cat(i + 1, `c${i}`));
    const out = pickCategoryShelves(cats, cats.map(() => courses(5)));
    expect(out).toHaveLength(MAX_CATEGORY_SHELVES);
  });

  it('thiếu dữ liệu khóa của một danh mục thì coi như rỗng', () => {
    expect(pickCategoryShelves([cat(1, 'a')], [])).toEqual([]);
  });
});
