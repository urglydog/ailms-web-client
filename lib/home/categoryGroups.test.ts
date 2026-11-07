import { describe, expect, it } from 'vitest';
import { categoryGroup, groupCategories } from './categoryGroups';

describe('categoryGroups', () => {
  it('phân loại theo slug', () => {
    expect(categoryGroup('lap-trinh-web')).toBe('it');
    expect(categoryGroup('giao-tiep-thuyet-trinh')).toBe('soft');
    expect(categoryGroup('kinh-doanh-tai-chinh')).toBe('other');
    expect(categoryGroup('danh-muc-la')).toBe('other');
  });

  it('chia nhóm theo thứ tự IT, kỹ năng mềm, khác và bỏ nhóm rỗng', () => {
    const r = groupCategories([{ slug: 'lanh-dao-quan-ly' }, { slug: 'lap-trinh-web' }, { slug: 'khoa-hoc-du-lieu' }]);
    expect(r.map((g) => g.group)).toEqual(['it', 'soft']);
    expect(r[0]!.items.map((c) => c.slug)).toEqual(['lap-trinh-web', 'khoa-hoc-du-lieu']);
  });
});
