import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EMPTY_FILTERS } from '@/lib/api/publicCourses';
import { renderWithIntl } from '@/test/renderWithIntl';
import { ActiveFilters } from './ActiveFilters';

const CATS = [{ id: 1, name: 'Lập trình Web', slug: 'lap-trinh-web' }];

describe('ActiveFilters', () => {
  it('chưa lọc gì thì không vẽ gì', () => {
    const { container } = renderWithIntl(
      <ActiveFilters filters={EMPTY_FILTERS} categories={CATS} onClear={vi.fn()} onClearAll={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('hiện từng chip với nhãn dịch được và bỏ từng chip', () => {
    const onClear = vi.fn();
    renderWithIntl(
      <ActiveFilters
        filters={{ ...EMPTY_FILTERS, priceType: 'free', level: 'BEGINNER', minRating: 4 }}
        categories={CATS}
        onClear={onClear}
        onClearAll={vi.fn()}
      />,
    );
    expect(screen.getByText('Miễn phí')).toBeInTheDocument();
    expect(screen.getByText('Cơ bản')).toBeInTheDocument();
    expect(screen.getByText('4.0 trở lên')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ lọc Miễn phí' }));
    expect(onClear).toHaveBeenCalledWith('priceType');
  });

  it('Xóa tất cả gọi onClearAll', () => {
    const onClearAll = vi.fn();
    renderWithIntl(
      <ActiveFilters filters={{ ...EMPTY_FILTERS, keyword: 'react' }} categories={CATS} onClear={vi.fn()} onClearAll={onClearAll} />,
    );
    expect(screen.getByText('“react”')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xóa tất cả' }));
    expect(onClearAll).toHaveBeenCalled();
  });
});
