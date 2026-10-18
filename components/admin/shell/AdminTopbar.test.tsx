import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { AdminTopbar } from './AdminTopbar';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/components/providers/NotificationProvider', () => ({
  useNotification: () => ({ notifications: [], unreadCount: 0, markAsRead: vi.fn(), markAllAsRead: vi.fn() }),
}));

function setup() {
  const props = { title: 'Tổng quan', user: { fullName: 'Quản Trị', avatarUrl: null }, onOpenMenu: vi.fn(), onOpenLanguage: vi.fn(), onLogout: vi.fn() };
  renderWithIntl(<AdminTopbar {...props} />);
  return props;
}

describe('AdminTopbar', () => {
  it('hiện tên mục và nút mở menu', () => {
    const p = setup();
    expect(screen.getByText('Tổng quan')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }));
    expect(p.onOpenMenu).toHaveBeenCalled();
  });

  it('menu tài khoản có vai trò, đổi ngôn ngữ và đăng xuất; Escape đóng', () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Tài khoản' }));
    expect(screen.getByText('Quản trị viên')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Ngôn ngữ' }));
    expect(p.onOpenLanguage).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Tài khoản' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Đăng xuất' }));
    expect(p.onLogout).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Tài khoản' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
