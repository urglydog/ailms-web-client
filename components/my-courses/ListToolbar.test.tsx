import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { ListToolbar } from './ListToolbar';

const COUNTS = { all: 6, 'in-progress': 4, completed: 2 };

function setup(overrides: Partial<React.ComponentProps<typeof ListToolbar>> = {}) {
  const props = {
    status: 'all' as const,
    counts: COUNTS,
    onStatusChange: vi.fn(),
    sort: 'recently-accessed' as const,
    onSortChange: vi.fn(),
    view: 'list' as const,
    onViewChange: vi.fn(),
    onSearch: vi.fn(),
    ...overrides,
  };
  renderWithIntl(<ListToolbar {...props} />);
  return props;
}

describe('ListToolbar', () => {
  it('hiện số lượng trong từng bộ lọc trạng thái và đánh dấu bộ lọc đang chọn', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Tất cả (6)' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Đang học (4)' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Hoàn thành (2)' })).toBeInTheDocument();
  });

  it('chọn bộ lọc trạng thái', () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành (2)' }));
    expect(p.onStatusChange).toHaveBeenCalledWith('completed');
  });

  it('chuyển dạng xem danh sách và thẻ, báo trạng thái bằng aria-pressed', () => {
    const p = setup({ view: 'list' });
    expect(screen.getByRole('button', { name: 'Dạng danh sách' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Dạng thẻ' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Dạng thẻ' }));
    expect(p.onViewChange).toHaveBeenCalledWith('grid');
  });

  it('tìm kiếm chỉ chạy khi nhấn Enter hoặc bấm nút, không chạy theo từng phím', () => {
    const p = setup();
    const input = screen.getByPlaceholderText('Tìm theo tên khóa học…');
    fireEvent.change(input, { target: { value: 'unity' } });
    expect(p.onSearch).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(p.onSearch).toHaveBeenLastCalledWith('unity');
    fireEvent.change(input, { target: { value: 'ai' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));
    expect(p.onSearch).toHaveBeenLastCalledWith('ai');
  });

  it('đổi cách sắp xếp', () => {
    const p = setup();
    fireEvent.change(screen.getByLabelText('Sắp xếp'), { target: { value: 'title-asc' } });
    expect(p.onSortChange).toHaveBeenCalledWith('title-asc');
  });
});
