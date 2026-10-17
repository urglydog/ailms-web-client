import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { CategoryTiles } from './CategoryTiles';

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    data: [
      { id: 1, name: 'Lập trình Web', slug: 'lap-trinh-web' },
      { id: 2, name: 'Khoa học dữ liệu', slug: 'khoa-hoc-du-lieu' },
    ],
  }),
}));

describe('CategoryTiles', () => {
  it('mỗi danh mục là một liên kết tới danh sách khóa theo danh mục', () => {
    renderWithIntl(<CategoryTiles />);
    expect(screen.getByRole('heading', { name: 'Khám phá theo chủ đề' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Lập trình Web/ })).toHaveAttribute('href', '/courses?category=lap-trinh-web');
    expect(screen.getByRole('link', { name: /Khoa học dữ liệu/ })).toHaveAttribute(
      'href',
      '/courses?category=khoa-hoc-du-lieu',
    );
  });
});
