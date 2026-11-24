import { describe, expect, it } from 'vitest';
import { MAIN_TAB_KEYS, resolveLearnTab, resolveMainTab } from './mainTabs';

describe('MAIN_TAB_KEYS', () => {
  it('7 tab theo thứ tự, có Transcript, Tài nguyên đã gộp vào Học liệu', () => {
    expect(MAIN_TAB_KEYS).toEqual(['overview', 'study-plan', 'qna', 'materials', 'transcript', 'gradebook', 'reviews']);
    expect(MAIN_TAB_KEYS).not.toContain('resources');
  });
});

describe('resolveMainTab', () => {
  it('giữ nguyên tab hợp lệ', () => {
    expect(resolveMainTab('qna')).toBe('qna');
    expect(resolveMainTab('transcript')).toBe('transcript');
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

describe('resolveLearnTab', () => {
  it('mobile: mặc định mở Bài giảng, giữ tab tutor', () => {
    expect(resolveLearnTab(null, false)).toBe('lessons');
    expect(resolveLearnTab('tutor', false)).toBe('tutor');
  });

  it('desktop: tab chỉ có ở mobile quay về Tổng quan', () => {
    expect(resolveLearnTab('lessons', true)).toBe('overview');
    expect(resolveLearnTab(null, true)).toBe('overview');
    expect(resolveLearnTab('qna', true)).toBe('qna');
  });
});
