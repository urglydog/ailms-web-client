import { describe, expect, it } from 'vitest';
import { EMPTY_FILTERS } from '@/lib/api/publicCourses';
import type { Category } from '@/types/domain';
import { activeFilterChips, clearFilter } from './filterChips';

const CATS: Category[] = [{ id: 1, name: 'Lập trình Web', slug: 'lap-trinh-web' }];

describe('activeFilterChips', () => {
  it('chưa lọc gì thì không có chip', () => {
    expect(activeFilterChips(EMPTY_FILTERS, CATS)).toEqual([]);
  });

  it('mỗi bộ lọc đang bật là một chip, danh mục lấy tên từ slug', () => {
    const chips = activeFilterChips(
      { category: 'lap-trinh-web', level: 'BEGINNER', priceType: 'free', keyword: 'react', minRating: 4.5, durationBucket: '1-3' },
      CATS,
    );
    expect(chips).toEqual([
      { key: 'keyword', kind: 'keyword', value: 'react' },
      { key: 'category', kind: 'text', value: 'Lập trình Web' },
      { key: 'level', kind: 'level', value: 'BEGINNER' },
      { key: 'priceType', kind: 'price', value: 'free' },
      { key: 'minRating', kind: 'rating', value: '4.5' },
      { key: 'durationBucket', kind: 'duration', value: '1-3' },
    ]);
  });

  it('slug danh mục lạ thì dùng chính slug làm nhãn', () => {
    expect(activeFilterChips({ ...EMPTY_FILTERS, category: 'khac' }, CATS)).toEqual([
      { key: 'category', kind: 'text', value: 'khac' },
    ]);
  });
});

describe('clearFilter', () => {
  it('bỏ đúng một bộ lọc và giữ nguyên các bộ lọc khác', () => {
    const f = { ...EMPTY_FILTERS, level: 'BEGINNER', priceType: 'paid' as const, keyword: 'x' };
    expect(clearFilter(f, 'level')).toEqual({ ...f, level: null });
    expect(clearFilter(f, 'priceType')).toEqual({ ...f, priceType: 'all' });
    expect(clearFilter(f, 'keyword')).toEqual({ ...f, keyword: '' });
  });
});
