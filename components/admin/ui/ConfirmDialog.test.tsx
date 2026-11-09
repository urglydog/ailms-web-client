import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

const props = { title: 'Khóa tài khoản?', body: 'Người dùng sẽ không đăng nhập được.', confirmLabel: 'Khóa', cancelLabel: 'Hủy' };

describe('ConfirmDialog', () => {
  it('đóng thì không render', () => {
    render(<ConfirmDialog {...props} open={false} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('mở thì có tên và mô tả, tiêu điểm ở nút Hủy', () => {
    render(<ConfirmDialog {...props} open onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('alertdialog', { name: 'Khóa tài khoản?' })).toHaveAccessibleDescription('Người dùng sẽ không đăng nhập được.');
    expect(screen.getByRole('button', { name: 'Hủy' })).toHaveFocus();
  });

  it('xác nhận, hủy và Escape gọi đúng hàm', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...props} open onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Khóa' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
