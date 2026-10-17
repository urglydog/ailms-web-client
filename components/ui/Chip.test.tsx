import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Chip } from './Chip';

describe('Chip', () => {
  it('báo trạng thái chọn qua aria-pressed', () => {
    const { rerender } = render(<Chip>Lập trình</Chip>);
    expect(screen.getByRole('button', { name: 'Lập trình' })).toHaveAttribute('aria-pressed', 'false');
    rerender(<Chip active>Lập trình</Chip>);
    expect(screen.getByRole('button', { name: 'Lập trình' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('dùng nền accent khi đang chọn', () => {
    render(<Chip active>Tất cả</Chip>);
    expect(screen.getByRole('button')).toHaveClass('bg-accent');
  });

  it('gọi onClick', () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Ngoại ngữ</Chip>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
