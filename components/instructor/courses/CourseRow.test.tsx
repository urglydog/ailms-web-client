import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { InstructorCourseSummary } from '@/types/domain';
import { CourseRow } from './CourseRow';

function course(overrides: Partial<InstructorCourseSummary> = {}): InstructorCourseSummary {
  return {
    id: 7,
    title: 'React thực chiến',
    slug: 'react',
    status: 'DRAFT',
    thumbnailUrl: null,
    categoryName: 'Lập trình Web',
    price: 0,
    isFree: true,
    avgRating: 0,
    totalLessons: 6,
    createdAt: '2026-10-01T00:00:00',
    completionPercent: 60,
    ...overrides,
  };
}

function setup(c: InstructorCourseSummary, overrides: Partial<React.ComponentProps<typeof CourseRow>> = {}) {
  const props = { course: c, selected: false, onToggleSelect: vi.fn(), onRemove: vi.fn(), onReactivate: vi.fn(), ...overrides };
  renderWithIntl(<CourseRow {...props} />);
  return props;
}

describe('CourseRow', () => {
  it('hiện tên, danh mục, số bài, trạng thái và phần trăm hoàn thiện', () => {
    setup(course());
    expect(screen.getByRole('link', { name: 'React thực chiến' })).toHaveAttribute('href', '/instructor/courses/7/edit');
    expect(screen.getByText(/Lập trình Web/)).toBeInTheDocument();
    expect(screen.getByText(/6 bài/)).toBeInTheDocument();
    expect(screen.getByText('Nháp')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('nháp chưa đủ thì gợi ý Hoàn thiện khóa học dẫn vào trình chỉnh sửa', () => {
    setup(course({ status: 'DRAFT', completionPercent: 60 }));
    expect(screen.getByRole('link', { name: 'Hoàn thiện khóa học' })).toHaveAttribute('href', '/instructor/courses/7/edit');
  });

  it('nháp đủ 100% thì gợi ý Gửi duyệt', () => {
    setup(course({ status: 'DRAFT', completionPercent: 100 }));
    expect(screen.getByRole('link', { name: 'Gửi duyệt' })).toBeInTheDocument();
  });

  it('bị từ chối thì gợi ý xem lý do và chỉnh sửa', () => {
    setup(course({ status: 'REJECTED' }));
    expect(screen.getByRole('link', { name: 'Xem lý do và chỉnh sửa' })).toBeInTheDocument();
  });

  it('đã xuất bản thì không có nút việc cần làm, chỉ báo đang mở cho học viên', () => {
    setup(course({ status: 'PUBLISHED', completionPercent: 100 }));
    expect(screen.getByText('Đang mở cho học viên')).toBeInTheDocument();
  });

  it('đã lưu trữ thì có nút Kích hoạt lại gọi onReactivate', () => {
    const p = setup(course({ status: 'ARCHIVED' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kích hoạt lại' }));
    expect(p.onReactivate).toHaveBeenCalledWith(7);
  });

  it('nút Gỡ bỏ gọi onRemove, ô chọn gọi onToggleSelect', () => {
    const p = setup(course());
    fireEvent.click(screen.getByRole('button', { name: 'Gỡ bỏ' }));
    expect(p.onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn React thực chiến' }));
    expect(p.onToggleSelect).toHaveBeenCalledWith(7);
  });
});
