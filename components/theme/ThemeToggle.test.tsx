import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { ThemeToggle } from './ThemeToggle';

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('ThemeToggle', () => {
  it('bấm thì chuyển sang tối, lưu lựa chọn và đổi nhãn', () => {
    localStorage.setItem('lms-theme', 'light');
    renderWithIntl(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: 'Chuyển sang giao diện tối' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('lms-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('đang tối thì bấm để về sáng', () => {
    localStorage.setItem('lms-theme', 'dark');
    document.documentElement.classList.add('dark');
    renderWithIntl(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('lms-theme')).toBe('light');
  });
});
