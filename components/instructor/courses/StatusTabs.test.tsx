import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { StatusTabs } from './StatusTabs';

const COUNTS = { ALL: 5, DRAFT: 1, PENDING: 1, PUBLISHED: 2, REJECTED: 1, ARCHIVED: 0, attention: 2 };

describe('StatusTabs', () => {
  it('hiện số lượng ở từng tab và đánh dấu tab đang chọn', () => {
    renderWithIntl(<StatusTabs counts={COUNTS} active="PUBLISHED" onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /Đã xuất bản.*2/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Tất cả.*5/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('bấm tab gọi onChange với trạng thái', () => {
    const onChange = vi.fn();
    renderWithIntl(<StatusTabs counts={COUNTS} active="ALL" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /Nháp/ }));
    expect(onChange).toHaveBeenCalledWith('DRAFT');
  });

  it('mũi tên phải chuyển sang tab kế tiếp', () => {
    const onChange = vi.fn();
    renderWithIntl(<StatusTabs counts={COUNTS} active="ALL" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('tab', { name: /Tất cả/ }), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('DRAFT');
  });
});
