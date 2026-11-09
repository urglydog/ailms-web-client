import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { InstructorTopbar } from './InstructorTopbar';

vi.mock('@/components/providers/NotificationProvider', () => ({
  useNotification: () => ({ notifications: [], unreadCount: 3, markAsRead: vi.fn(), markAllAsRead: vi.fn() }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

function setup(overrides: Partial<React.ComponentProps<typeof InstructorTopbar>> = {}) {
  const props = {
    title: 'Hiệu suất',
    user: { fullName: 'Trần Thanh Hà', avatarUrl: null },
    onOpenMenu: vi.fn(),
    onOpenLanguage: vi.fn(),
    onLogout: vi.fn(),
    ...overrides,
  };
  renderWithIntl(<InstructorTopbar {...props} />);
  return props;
}

describe('InstructorTopbar', () => {
  it('hiện tiêu đề mục và nút Tạo khóa học dẫn tới trang tạo', () => {
    setup();
    expect(screen.getByText('Hiệu suất')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tạo khóa học' })).toHaveAttribute('href', '/instructor/courses/new');
  });

  it('nút menu (điện thoại) gọi onOpenMenu', () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }));
    expect(p.onOpenMenu).toHaveBeenCalled();
  });

  it('chuông có số thông báo chưa đọc và mở được bảng thông báo', () => {
    setup();
    const bell = screen.getByRole('button', { name: /Thông báo/ });
    expect(bell).toHaveTextContent('3');
    fireEvent.click(bell);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('menu tài khoản có tên, vai trò, Ngôn ngữ và Đăng xuất', () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Tài khoản' }));
    expect(screen.getByText('Trần Thanh Hà')).toBeInTheDocument();
    expect(screen.getByText('Giảng viên')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Ngôn ngữ' }));
    expect(p.onOpenLanguage).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Tài khoản' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Đăng xuất' }));
    expect(p.onLogout).toHaveBeenCalled();
  });

  it('Escape đóng menu tài khoản', () => {
    setup();
    const btn = screen.getByRole('button', { name: 'Tài khoản' });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });
});
