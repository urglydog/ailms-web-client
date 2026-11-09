import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { InstructorSidebar } from './InstructorSidebar';

function setup(overrides: Partial<React.ComponentProps<typeof InstructorSidebar>> = {}) {
  const props = { pathname: '/instructor/courses', collapsed: false, onToggleCollapsed: vi.fn(), ...overrides };
  renderWithIntl(<InstructorSidebar {...props} />);
  return props;
}

describe('InstructorSidebar', () => {
  it('có 5 mục điều hướng và liên kết về trang học viên', () => {
    setup();
    const nav = screen.getByRole('navigation', { name: 'Điều hướng kênh giảng viên' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Khóa học của tôi' })).toHaveAttribute('href', '/instructor/courses');
    expect(screen.getByRole('link', { name: 'Gói khóa học' })).toHaveAttribute('href', '/instructor/bundles');
    expect(screen.getByRole('link', { name: 'Giao tiếp' })).toHaveAttribute('href', '/instructor/communication');
    expect(screen.getByRole('link', { name: 'Hiệu suất' })).toHaveAttribute('href', '/instructor/revenue');
    expect(screen.getByRole('link', { name: 'Công cụ' })).toHaveAttribute('href', '/instructor/tools');
    expect(screen.getByRole('link', { name: 'Về trang học viên' })).toHaveAttribute('href', '/');
  });

  it('đánh dấu mục đang mở bằng aria-current', () => {
    setup({ pathname: '/instructor/revenue/students' });
    expect(screen.getByRole('link', { name: 'Hiệu suất' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Khóa học của tôi' })).not.toHaveAttribute('aria-current');
  });

  it('trang Live làm sáng mục Công cụ', () => {
    setup({ pathname: '/instructor/live/new' });
    expect(screen.getByRole('link', { name: 'Công cụ' })).toHaveAttribute('aria-current', 'page');
  });

  it('nút thu gọn gọi onToggleCollapsed và báo trạng thái qua aria-expanded', () => {
    const p = setup();
    const btn = screen.getByRole('button', { name: 'Thu gọn thanh bên' });
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(btn);
    expect(p.onToggleCollapsed).toHaveBeenCalled();
  });

  it('khi thu gọn nút đổi thành Mở rộng nhưng các liên kết vẫn có tên để đọc', () => {
    setup({ collapsed: true });
    expect(screen.getByRole('button', { name: 'Mở rộng thanh bên' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('link', { name: 'Hiệu suất' })).toBeInTheDocument();
  });
});
