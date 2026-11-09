import { describe, expect, it } from 'vitest';
import { makeCourse } from '@/test/fixtures';
import { pickTrending } from './trending';

const COURSES = [1, 2, 3, 4, 5, 6].map((id) => makeCourse(id));

describe('pickTrending', () => {
  it('cắt tối đa 4 thẻ theo thứ tự', () => {
    expect(pickTrending(COURSES, null).map((c) => c.id)).toEqual([1, 2, 3, 4]);
  });

  it('bỏ khóa học đã sở hữu rồi mới cắt', () => {
    expect(pickTrending(COURSES, new Set([1, 3])).map((c) => c.id)).toEqual([2, 4, 5, 6]);
  });

  it('ownedIds là null (khách) thì không lọc gì', () => {
    expect(pickTrending(COURSES.slice(0, 2), null)).toHaveLength(2);
  });

  it('tôn trọng giới hạn truyền vào', () => {
    expect(pickTrending(COURSES, null, 2)).toHaveLength(2);
  });
});
