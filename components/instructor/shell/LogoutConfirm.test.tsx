import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { LogoutConfirm } from './LogoutConfirm';

describe('LogoutConfirm', () => {
  it('đóng thì không vẽ gì', () => {
    renderWithIntl(<LogoutConfirm open={false} onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('mở thì hỏi xác nhận, Hủy và Đăng xuất gọi đúng hàm', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    renderWithIntl(<LogoutConfirm open onCancel={onCancel} onConfirm={onConfirm} />);
    expect(screen.getByRole('alertdialog', { name: 'Xác nhận đăng xuất' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalled();
  });

  it('Escape hủy', () => {
    const onCancel = vi.fn();
    renderWithIntl(<LogoutConfirm open onCancel={onCancel} onConfirm={vi.fn()} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });
});
