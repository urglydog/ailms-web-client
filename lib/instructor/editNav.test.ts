import { describe, expect, it } from 'vitest';
import { EDIT_TABS, activeEditTab, editCompletion, editTabHref } from './editNav';

describe('EDIT_TABS', () => {
  it('có 7 tab: 4 thuộc nội dung và 3 thuộc đăng tải, theo thứ tự', () => {
    expect(EDIT_TABS.map((t) => t.key)).toEqual(['curriculum', 'materials', 'resources', 'proctoring', 'basics', 'pricing', 'promotions']);
    expect(EDIT_TABS.filter((t) => t.group === 'content')).toHaveLength(4);
    expect(EDIT_TABS.filter((t) => t.group === 'publish')).toHaveLength(3);
  });
});

describe('editTabHref', () => {
  it('ghép đường dẫn theo mã khóa', () => {
    expect(editTabHref(12, 'pricing')).toBe('/instructor/courses/12/edit/pricing');
  });
});

describe('activeEditTab', () => {
  it('nhận ra tab theo đường dẫn, kể cả trang con', () => {
    expect(activeEditTab('/instructor/courses/12/edit/curriculum', 12)).toBe('curriculum');
    expect(activeEditTab('/instructor/courses/12/edit/materials/folder/3', 12)).toBe('materials');
  });
  it('trang gốc /edit hoặc khóa khác thì không có tab nào', () => {
    expect(activeEditTab('/instructor/courses/12/edit', 12)).toBeNull();
    expect(activeEditTab('/instructor/courses/99/edit/pricing', 12)).toBeNull();
  });
});

describe('editCompletion', () => {
  it('đủ điều kiện thì 100%, mỗi điều kiện thiếu trừ 20%', () => {
    expect(editCompletion({ canSubmit: true, missingConditions: [] })).toBe(100);
    expect(editCompletion({ canSubmit: false, missingConditions: ['a', 'b'] })).toBe(60);
  });
  it('không âm dù thiếu nhiều', () => {
    expect(editCompletion({ canSubmit: false, missingConditions: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] })).toBe(0);
  });
});
