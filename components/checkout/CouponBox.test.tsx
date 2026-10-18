import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { CouponBox } from './CouponBox';

function setup(overrides: Partial<React.ComponentProps<typeof CouponBox>> = {}) {
  const props = {
    value: '',
    appliedCode: null as string | null,
    applying: false,
    onChange: vi.fn(),
    onApply: vi.fn(),
    onRemove: vi.fn(),
    ...overrides,
  };
  renderWithIntl(<CouponBox {...props} />);
  return props;
}

describe('CouponBox', () => {
  it('chưa áp mã: có ô nhập, gõ thì gọi onChange', () => {
    const p = setup();
    fireEvent.change(screen.getByPlaceholderText('Nhập mã giảm giá'), { target: { value: 'ABC' } });
    expect(p.onChange).toHaveBeenCalledWith('ABC');
  });

  it('bấm Áp dụng hoặc nhấn Enter thì gọi onApply', () => {
    const p = setup({ value: 'SALE10' });
    fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));
    fireEvent.keyDown(screen.getByPlaceholderText('Nhập mã giảm giá'), { key: 'Enter' });
    expect(p.onApply).toHaveBeenCalledTimes(2);
  });

  it('đang kiểm tra thì khóa nút và đổi chữ', () => {
    setup({ applying: true });
    expect(screen.getByRole('button', { name: 'Đang kiểm tra...' })).toBeDisabled();
  });

  it('đã áp mã: hiện mã viết hoa và nút Bỏ mã', () => {
    const p = setup({ appliedCode: 'sale10' });
    expect(screen.getByText('SALE10')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Nhập mã giảm giá')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ mã' }));
    expect(p.onRemove).toHaveBeenCalled();
  });
});
