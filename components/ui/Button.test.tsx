import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('biến thể highlight dùng nền vàng và chữ ink', () => {
    render(<Button variant="highlight">Học tiếp</Button>);
    const btn = screen.getByRole('button', { name: 'Học tiếp' });
    expect(btn).toHaveClass('bg-highlight');
    expect(btn).toHaveClass('text-ink');
  });

  it('biến thể cyan dùng chữ cyan-ink', () => {
    render(<Button variant="cyan">Tiếng Việt</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-cyan-ink');
  });

  it('bo góc 6px (rounded-md)', () => {
    render(<Button>Khám phá</Button>);
    expect(screen.getByRole('button')).toHaveClass('rounded-md');
  });

  it('vô hiệu khi disabled', () => {
    render(<Button disabled>Lưu</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
