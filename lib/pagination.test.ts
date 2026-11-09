import { describe, expect, it } from 'vitest';
import { pageItems, parsePageParam } from './pagination';

describe('pageItems', () => {
  it('ít trang thì hiện đủ', () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('nhiều trang thì rút gọn bằng dấu …', () => {
    expect(pageItems(1, 20)).toEqual([1, 2, 'gap', 20]);
    expect(pageItems(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20]);
    expect(pageItems(20, 20)).toEqual([1, 'gap', 19, 20]);
  });

  it('bỏ đúng 1 trang thì hiện số thay vì …', () => {
    expect(pageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('không có trang nào', () => {
    expect(pageItems(1, 0)).toEqual([]);
  });
});

describe('parsePageParam', () => {
  it('chỉ nhận số nguyên dương', () => {
    expect(parsePageParam('3')).toBe(3);
    expect(parsePageParam(null)).toBe(1);
    expect(parsePageParam('0')).toBe(1);
    expect(parsePageParam('abc')).toBe(1);
    expect(parsePageParam('2.5')).toBe(1);
  });
});
