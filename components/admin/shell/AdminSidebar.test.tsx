import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { AdminSidebar } from './AdminSidebar';

function setup(overrides: Partial<React.ComponentProps<typeof AdminSidebar>> = {}) {
  const props = { pathname: '/admin', collapsed: false, onToggleCollapsed: vi.fn(), pendingCourses: 0, ...overrides };
  renderWithIntl(<AdminSidebar {...props} />);
  return props;
}

describe('AdminSidebar', () => {
  it('có vùng điều hướng, tiêu đề nhóm và liên kết về trang học viên', () => {
    setup();
    expect(screen.getByRole('navigation', { name: 'Điều hướng quản trị' })).toBeInTheDocument();
    expect(screen.getByText('Nội dung khóa học')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kiểm duyệt khóa học' })).toHaveAttribute('href', '/admin/moderation');
    expect(screen.getByRole('link', { name: 'Về trang học viên' })).toHaveAttribute('href', '/');
  });

  it('đánh dấu mục đang mở bằng aria-current', () => {
    setup({ pathname: '/admin/transactions/payments' });
    expect(screen.getByRole('link', { name: 'Đối soát giao dịch' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Tổng quan' })).not.toHaveAttribute('aria-current');
  });

  it('hiện số khóa chờ duyệt cạnh mục Kiểm duyệt', () => {
    setup({ pendingCourses: 4 });
    expect(screen.getByRole('link', { name: /Kiểm duyệt khóa học/ })).toHaveTextContent('4');
  });

  it('nút thu gọn gọi onToggleCollapsed', () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn thanh bên' }));
    expect(p.onToggleCollapsed).toHaveBeenCalled();
  });

  it('khi thu gọn nút đổi thành Mở rộng, liên kết vẫn có tên để đọc', () => {
    setup({ collapsed: true });
    expect(screen.getByRole('button', { name: 'Mở rộng thanh bên' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('link', { name: 'Người dùng' })).toBeInTheDocument();
  });
});
