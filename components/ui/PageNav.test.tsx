import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PageNav } from './PageNav';

const labels = { nav: 'Phân trang', prev: 'Trang trước', next: 'Trang sau', page: (n: number) => `Trang ${n}` };

describe('PageNav', () => {
  it('ẩn khi chỉ có 1 trang', () => {
    const { container } = render(<PageNav page={1} totalPages={1} onChange={vi.fn()} labels={labels} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('đánh dấu trang hiện tại và chuyển trang', () => {
    const onChange = vi.fn();
    render(<PageNav page={2} totalPages={5} onChange={onChange} labels={labels} />);
    expect(screen.getByRole('navigation', { name: 'Phân trang' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trang 2' })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('button', { name: 'Trang 4' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trang trước' }));
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([4, 3, 1]);
  });

  it('khóa nút Trước ở trang đầu và Sau ở trang cuối', () => {
    const { rerender } = render(<PageNav page={1} totalPages={3} onChange={vi.fn()} labels={labels} />);
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled();
    rerender(<PageNav page={3} totalPages={3} onChange={vi.fn()} labels={labels} />);
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled();
  });
});
