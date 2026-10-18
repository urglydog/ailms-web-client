import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { EditTabs } from './EditTabs';

describe('EditTabs', () => {
  it('có 7 liên kết dẫn tới các trang chỉnh sửa theo mã khóa', () => {
    renderWithIntl(<EditTabs courseId={12} pathname="/instructor/courses/12/edit/curriculum" settingsOpen={false} />);
    expect(screen.getByRole('navigation', { name: 'Các mục chỉnh sửa khóa học' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Chương trình giảng dạy' })).toHaveAttribute('href', '/instructor/courses/12/edit/curriculum');
    expect(screen.getByRole('link', { name: 'Khuyến mãi' })).toHaveAttribute('href', '/instructor/courses/12/edit/promotions');
    expect(screen.getAllByRole('link')).toHaveLength(7);
  });

  it('đánh dấu tab đang mở bằng aria-current', () => {
    renderWithIntl(<EditTabs courseId={12} pathname="/instructor/courses/12/edit/pricing" settingsOpen={false} />);
    expect(screen.getByRole('link', { name: 'Giá cả' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Thông tin cơ bản' })).not.toHaveAttribute('aria-current');
  });

  it('đang mở Cài đặt thì không tab nào được đánh dấu', () => {
    renderWithIntl(<EditTabs courseId={12} pathname="/instructor/courses/12/edit/pricing" settingsOpen />);
    expect(screen.getByRole('link', { name: 'Giá cả' })).not.toHaveAttribute('aria-current');
  });

  it('có tiêu đề hai nhóm: Nội dung khóa học và Đăng tải khóa học', () => {
    renderWithIntl(<EditTabs courseId={12} pathname="/instructor/courses/12/edit/curriculum" settingsOpen={false} />);
    expect(screen.getByText('Nội dung khóa học')).toBeInTheDocument();
    expect(screen.getByText('Đăng tải khóa học')).toBeInTheDocument();
  });
});
