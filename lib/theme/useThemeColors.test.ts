import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { COLORS, DARK_COLORS } from './colors';
import { useThemeColors } from './useThemeColors';

afterEach(() => document.documentElement.classList.remove('dark'));

describe('useThemeColors', () => {
  it('trả bảng sáng, rồi đổi sang bảng tối khi <html> có lớp dark', async () => {
    const { result } = renderHook(() => useThemeColors());
    expect(result.current.line).toBe(COLORS.line);
    await act(async () => {
      document.documentElement.classList.add('dark');
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.line).toBe(DARK_COLORS.line);
  });
});
