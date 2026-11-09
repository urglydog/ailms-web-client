import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { AccountMenu } from './AccountMenu';

const base = { id: 7, fullName: 'Nguyen Van A', email: 'student1@lms.local', avatarUrl: null };

function setup(role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN') {
  const handlers = { onNavigate: vi.fn(), onOpenLanguage: vi.fn(), onLogout: vi.fn() };
  renderWithIntl(<AccountMenu user={{ ...base, role }} languageName="Tiếng Việt" {...handlers} />);
  return handlers;
}

describe('AccountMenu', () => {
  it('hiện tên, email và các mục của học viên', () => {
    setup('STUDENT');
    expect(screen.getByText('Nguyen Van A')).toBeInTheDocument();
    expect(screen.getByText('student1@lms.local')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Khóa học của tôi' })).toHaveAttribute('href', '/my-courses');
    expect(screen.getByRole('link', { name: 'Danh sách yêu thích' })).toHaveAttribute('href', '/wishlist');
    expect(screen.getByRole('link', { name: 'Chứng chỉ và thành tích' })).toHaveAttribute('href', '/u/7?tab=certificates');
    expect(screen.getByRole('link', { name: 'Trở thành Giảng viên' })).toHaveAttribute('href', '/teaching');
    expect(screen.queryByRole('link', { name: 'Truy cập trang Quản trị' })).toBeNull();
  });

  it('admin thấy liên kết quản trị', () => {
    setup('ADMIN');
    expect(screen.getByRole('link', { name: 'Truy cập trang Quản trị' })).toHaveAttribute('href', '/admin');
  });

  it('chọn một liên kết thì gọi onNavigate để đóng menu', () => {
    const h = setup('STUDENT');
    fireEvent.click(screen.getByRole('link', { name: 'Khóa học của tôi' }));
    expect(h.onNavigate).toHaveBeenCalledTimes(1);
  });

  it('nút Ngôn ngữ hiện ngôn ngữ hiện tại và gọi onOpenLanguage', () => {
    const h = setup('STUDENT');
    const btn = screen.getByRole('button', { name: /Ngôn ngữ/ });
    expect(btn).toHaveTextContent('Tiếng Việt');
    fireEvent.click(btn);
    expect(h.onOpenLanguage).toHaveBeenCalledTimes(1);
  });

  it('nút Đăng xuất gọi onLogout', () => {
    const h = setup('STUDENT');
    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
    expect(h.onLogout).toHaveBeenCalledTimes(1);
  });
});
