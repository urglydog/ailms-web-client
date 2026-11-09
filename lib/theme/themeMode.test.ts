import { describe, expect, it } from 'vitest';
import { THEME_INIT_SCRIPT, parseTheme, resolveTheme } from './themeMode';

describe('themeMode', () => {
  it('ưu tiên lựa chọn đã lưu', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });

  it('chưa chọn hoặc giá trị lạ thì theo hệ điều hành', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme('blue', false)).toBe('light');
  });

  it('chỉ nhận light/dark', () => {
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme(undefined)).toBeNull();
  });

  it('script khởi tạo gắn lớp dark theo lựa chọn đã lưu', () => {
    localStorage.setItem('lms-theme', 'dark');
    new Function(THEME_INIT_SCRIPT)();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    localStorage.setItem('lms-theme', 'light');
    new Function(THEME_INIT_SCRIPT)();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    localStorage.clear();
  });
});
