import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { MobileDrawer } from './MobileDrawer';

const CATS = [
  { id: 1, name: 'Lập trình Web', slug: 'lap-trinh-web' },
  { id: 2, name: 'Khoa học dữ liệu', slug: 'khoa-hoc-du-lieu' },
];

function setup(overrides: Partial<React.ComponentProps<typeof MobileDrawer>> = {}) {
  const props = {
    open: true,
    onClose: vi.fn(),
    categories: CATS,
    isLoggedIn: false,
    liveNow: false,
    pathname: '/',
    search: '',
    onSearchChange: vi.fn(),
    onSearchSubmit: vi.fn(),
    ...overrides,
  };
  renderWithIntl(<MobileDrawer {...props} />);
  return props;
}

describe('MobileDrawer', () => {
  it('đóng thì không vẽ gì', () => {
    setup({ open: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('mở thì là hộp thoại modal, liệt kê tất cả khóa học và từng danh mục', () => {
    setup();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('link', { name: 'Tất cả khóa học' })).toHaveAttribute('href', '/courses');
    expect(screen.getByRole('link', { name: 'Lập trình Web' })).toHaveAttribute('href', '/courses?category=lap-trinh-web');
    expect(screen.getByRole('link', { name: 'Khoa học dữ liệu' })).toHaveAttribute('href', '/courses?category=khoa-hoc-du-lieu');
  });

  it('có Cộng đồng, Về chúng tôi và Live', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Cộng đồng' })).toHaveAttribute('href', '/community');
    expect(screen.getByRole('link', { name: 'Về chúng tôi' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: /Live/ })).toHaveAttribute('href', '/live');
  });

  it('khách thấy Đăng nhập và Bắt đầu; đã đăng nhập thì thấy Khóa học của tôi', () => {
    const first = renderWithIntl(
      <MobileDrawer open onClose={vi.fn()} categories={[]} isLoggedIn={false} liveNow={false} pathname="/" search="" onSearchChange={vi.fn()} onSearchSubmit={vi.fn()} />,
    );
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Bắt đầu' })).toHaveAttribute('href', '/register');
    first.unmount();
    renderWithIntl(
      <MobileDrawer open onClose={vi.fn()} categories={[]} isLoggedIn liveNow={false} pathname="/" search="" onSearchChange={vi.fn()} onSearchSubmit={vi.fn()} />,
    );
    expect(screen.getByRole('link', { name: 'Khóa học của tôi' })).toHaveAttribute('href', '/my-courses');
    expect(screen.queryByRole('link', { name: 'Đăng nhập' })).toBeNull();
  });

  it('nhấn Escape hoặc bấm nền mờ hoặc nút đóng thì gọi onClose', () => {
    const p = setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByTestId('drawer-overlay'));
    fireEvent.click(screen.getByRole('button', { name: 'Đóng menu' }));
    expect(p.onClose).toHaveBeenCalledTimes(3);
  });

  it('bấm một liên kết thì đóng ngăn kéo', () => {
    const p = setup();
    fireEvent.click(screen.getByRole('link', { name: 'Cộng đồng' }));
    expect(p.onClose).toHaveBeenCalled();
  });

  it('ô tìm kiếm gọi onSearchChange khi gõ và onSearchSubmit khi nhấn Enter', () => {
    const p = setup();
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'react' } });
    expect(p.onSearchChange).toHaveBeenCalledWith('react');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(p.onSearchSubmit).toHaveBeenCalled();
  });

  it('mở thì khóa cuộn trang nền và trả lại khi đóng', () => {
    const { unmount } = renderWithIntl(
      <MobileDrawer open onClose={vi.fn()} categories={[]} isLoggedIn={false} liveNow={false} pathname="/" search="" onSearchChange={vi.fn()} onSearchSubmit={vi.fn()} />,
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
