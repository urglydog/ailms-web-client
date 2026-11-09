import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { ViewToggle } from './ViewToggle';

describe('ViewToggle', () => {
  it('đánh dấu dạng đang chọn và đổi dạng khi bấm', () => {
    const onChange = vi.fn();
    renderWithIntl(<ViewToggle view="grid" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Dạng thẻ' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Dạng danh sách' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Dạng danh sách' }));
    expect(onChange).toHaveBeenCalledWith('list');
  });
});
