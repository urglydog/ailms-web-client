import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { AdminUser } from '@/lib/admin/users';
import { UsersTable } from './UsersTable';

const u = (over: Partial<AdminUser>): AdminUser => ({
  id: 1, fullName: 'An Nguyễn', email: 'an@x.vn', role: 'STUDENT', isActive: true, createdAt: '2026-01-05T00:00:00Z', ...over,
});

function setup(users: AdminUser[], extra: Partial<React.ComponentProps<typeof UsersTable>> = {}) {
  const props = { users, sortField: 'createdAt' as const, sortOrder: 'desc' as const, onSort: vi.fn(), onToggleBlock: vi.fn(), ...extra };
  renderWithIntl(<UsersTable {...props} />);
  return props;
}

describe('UsersTable', () => {
  it('rỗng thì báo không tìm thấy', () => {
    setup([]);
    expect(screen.getByText('Không tìm thấy người dùng phù hợp.')).toBeInTheDocument();
  });

  it('hiện vai trò bằng nhãn dễ đọc và trạng thái hoạt động/bị khóa', () => {
    setup([u({}), u({ id: 2, fullName: 'Bình', email: 'b@x.vn', role: 'INSTRUCTOR', isActive: false })]);
    expect(screen.getByText('Học viên')).toBeInTheDocument();
    expect(screen.getByText('Giảng viên')).toBeInTheDocument();
    expect(screen.getByText('Hoạt động')).toBeInTheDocument();
    expect(screen.getByText('Bị khóa')).toBeInTheDocument();
  });

  it('cột đang sắp xếp báo aria-sort và bấm tiêu đề gọi onSort', () => {
    const p = setup([u({})]);
    expect(screen.getByRole('columnheader', { name: /Ngày tạo/ })).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByRole('columnheader', { name: /Email/ })).toHaveAttribute('aria-sort', 'none');
    fireEvent.click(screen.getByRole('button', { name: /Email/ }));
    expect(p.onSort).toHaveBeenCalledWith('email');
  });

  it('quản trị viên không có nút khóa; người khác có và gọi onToggleBlock', () => {
    const p = setup([u({ id: 9, fullName: 'Root', email: 'r@x.vn', role: 'ADMIN' }), u({})]);
    const buttons = screen.getAllByRole('button', { name: /Khóa tài khoản/ });
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0]!);
    expect(p.onToggleBlock).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });
});
