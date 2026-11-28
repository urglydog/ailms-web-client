import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { EditTabs } from './EditTabs';

describe('EditTabs', () => {
  it('có 8 liên kết dẫn tới các trang chỉnh sửa theo mã khóa', () => {
    renderWithIntl(<EditTabs courseId={12} pathname="/instructor/courses/12/edit/curriculum" settingsOpen={false} />);
    expect(screen.getByRole('navigation', { name: 'Các mục chỉnh sửa khóa học' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Chương trình giảng dạy' })).toHaveAttribute('href', '/instructor/courses/12/edit/curriculum');
    expect(screen.getByRole('link', { name: 'Khuyến mãi' })).toHaveAttribute('href', '/instructor/courses/12/edit/promotions');
    expect(screen.getAllByRole('link')).toHaveLength(8);
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

  it('có tiêu đề ba nhóm: Lập kế hoạch, Tạo nội dung, Xuất bản', () => {
    renderWithIntl(<EditTabs courseId={12} pathname="/instructor/courses/12/edit/curriculum" settingsOpen={false} />);
    expect(screen.getByText('Lập kế hoạch')).toBeInTheDocument();
    expect(screen.getByText('Tạo nội dung')).toBeInTheDocument();
    expect(screen.getByText('Xuất bản')).toBeInTheDocument();
  });
});

describe('EditTabs checklist', () => {
  it('chấm ✓ bước đã xong và có nút Gửi duyệt', () => {
    const course = { title: 'A', description: 'B', thumbnailUrl: 'x', price: 0, isFree: true, chapters: [{ lessons: [1] }], learningOutcomes: [] };
    renderWithIntl(
      <EditTabs
        courseId={12}
        pathname="/instructor/courses/12/edit/goals"
        settingsOpen={false}
        course={course}
        submit={{ onSubmit: () => {}, canSubmit: true, submitting: false }}
      />,
    );
    expect(screen.getByRole('link', { name: /Chương trình giảng dạy \(Đã xong\)/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Học viên mục tiêu' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Gửi duyệt' })).toBeEnabled();
  });
});
