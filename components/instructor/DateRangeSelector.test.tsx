import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { DateRangeSelector } from './DateRangeSelector';

describe('DateRangeSelector', () => {
  it('nút hiện khoảng đang chọn và mở danh sách lựa chọn', () => {
    renderWithIntl(<DateRangeSelector value="30d" onChange={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /30 ngày qua/ });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('chọn một khoảng thì gọi onChange và đóng danh sách', () => {
    const onChange = vi.fn();
    renderWithIntl(<DateRangeSelector value="30d" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /30 ngày qua/ }));
    fireEvent.click(screen.getByRole('option', { name: '12 tháng qua' }));
    expect(onChange).toHaveBeenCalledWith('12m');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('Escape đóng danh sách', () => {
    renderWithIntl(<DateRangeSelector value="7d" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /7 ngày qua/ }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
