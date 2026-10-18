import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { CategoryChips } from './CategoryChips';

const CATS = [
  { id: 1, name: 'Lập trình Web', slug: 'lap-trinh-web' },
  { id: 2, name: 'Khoa học dữ liệu', slug: 'khoa-hoc-du-lieu' },
];

describe('CategoryChips', () => {
  it('Tất cả đang chọn khi chưa có danh mục', () => {
    renderWithIntl(<CategoryChips categories={CATS} selected={null} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Tất cả' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Lập trình Web' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('bấm chip gọi onSelect với slug, bấm Tất cả gọi với null', () => {
    const onSelect = vi.fn();
    renderWithIntl(<CategoryChips categories={CATS} selected="lap-trinh-web" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Khoa học dữ liệu' }));
    expect(onSelect).toHaveBeenLastCalledWith('khoa-hoc-du-lieu');
    fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });
});
