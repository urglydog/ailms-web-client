import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { AdminNavDrawer } from './AdminNavDrawer';

describe('AdminNavDrawer', () => {
  it('đóng thì không render gì', () => {
    renderWithIntl(<AdminNavDrawer open={false} onClose={vi.fn()} pathname="/admin" pendingCourses={0} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('mở thì có hộp thoại, đủ mục, đóng bằng Escape/nền mờ/nút đóng', () => {
    const onClose = vi.fn();
    renderWithIntl(<AdminNavDrawer open onClose={onClose} pathname="/admin/users" pendingCourses={2} />);
    expect(screen.getByRole('dialog', { name: 'Menu quản trị' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Người dùng' })).toHaveAttribute('aria-current', 'page');
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByTestId('drawer-overlay'));
    fireEvent.click(screen.getByRole('button', { name: 'Đóng menu' }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
