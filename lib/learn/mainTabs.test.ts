import { describe, expect, it } from 'vitest';
import { MAIN_TAB_KEYS, resolveMainTab } from './mainTabs';

describe('MAIN_TAB_KEYS', () => {
  it('gọn còn 6 tab, Tài nguyên đã gộp vào Học liệu', () => {
    expect(MAIN_TAB_KEYS).toEqual(['overview', 'study-plan', 'qna', 'materials', 'gradebook', 'reviews']);
    expect(MAIN_TAB_KEYS).not.toContain('resources');
  });
});

describe('resolveMainTab', () => {
  it('giữ nguyên tab hợp lệ', () => {
    expect(resolveMainTab('qna')).toBe('qna');
    expect(resolveMainTab('gradebook')).toBe('gradebook');
  });

  it('liên kết cũ ?tab=resources chuyển sang Học liệu', () => {
    expect(resolveMainTab('resources')).toBe('materials');
  });

  it('không có hoặc không hợp lệ thì về Tổng quan', () => {
    expect(resolveMainTab(null)).toBe('overview');
    expect(resolveMainTab('khong-co')).toBe('overview');
    expect(resolveMainTab('')).toBe('overview');
  });
});
