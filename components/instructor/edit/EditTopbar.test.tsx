import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { EditTopbar } from './EditTopbar';

function setup(overrides: Partial<React.ComponentProps<typeof EditTopbar>> = {}) {
  const props = {
    title: 'React thực chiến',
    status: 'DRAFT' as const,
    completion: 60,
    missing: ['Thiếu ảnh bìa'],
    canSubmit: false,
    submitting: false,
    settingsOpen: false,
    canPreviewAsInstructor: true,
    onSubmit: vi.fn(),
    onToggleSettings: vi.fn(),
    onPreviewInstructor: vi.fn(),
    onPreviewLearner: vi.fn(),
    ...overrides,
  };
  renderWithIntl(<EditTopbar {...props} />);
  return props;
}

describe('EditTopbar', () => {
  it('có liên kết quay lại danh sách, tên khóa và trạng thái', () => {
    setup();
    expect(screen.getByRole('link', { name: /Quay lại các khóa học/ })).toHaveAttribute('href', '/instructor/courses');
    expect(screen.getByRole('heading', { level: 1, name: 'React thực chiến' })).toBeInTheDocument();
    expect(screen.getByText('Nháp')).toBeInTheDocument();
  });

  it('nháp chưa đủ điều kiện thì nút Gửi duyệt bị khóa; đủ thì bấm được', () => {
    const first = setup({ canSubmit: false });
    expect(screen.getByRole('button', { name: 'Gửi duyệt' })).toBeDisabled();
    expect(first.onSubmit).not.toHaveBeenCalled();
  });

  it('đủ điều kiện thì Gửi duyệt gọi onSubmit', () => {
    const p = setup({ canSubmit: true, completion: 100, missing: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi duyệt' }));
    expect(p.onSubmit).toHaveBeenCalled();
  });

  it('bị từ chối thì nút đổi thành Gửi duyệt lại', () => {
    setup({ status: 'REJECTED', canSubmit: true });
    expect(screen.getByRole('button', { name: 'Gửi duyệt lại' })).toBeInTheDocument();
  });

  it('khóa đã xuất bản hoặc đang chờ duyệt thì không có nút gửi duyệt', () => {
    setup({ status: 'PUBLISHED' });
    expect(screen.queryByRole('button', { name: /Gửi duyệt/ })).toBeNull();
  });

  it('menu Xem trước có hai lựa chọn và gọi đúng hàm', () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: /Xem trước/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Với tư cách là Giảng viên' }));
    expect(p.onPreviewInstructor).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Xem trước/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Với tư cách là học viên' }));
    expect(p.onPreviewLearner).toHaveBeenCalled();
  });

  it('chưa có bài học thì không xem trước được với tư cách giảng viên', () => {
    setup({ canPreviewAsInstructor: false });
    fireEvent.click(screen.getByRole('button', { name: /Xem trước/ }));
    expect(screen.getByRole('menuitem', { name: 'Với tư cách là Giảng viên' })).toBeDisabled();
  });

  it('nút Cài đặt báo trạng thái bằng aria-pressed và gọi onToggleSettings', () => {
    const p = setup({ settingsOpen: true });
    const btn = screen.getByRole('button', { name: 'Cài đặt' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(btn);
    expect(p.onToggleSettings).toHaveBeenCalled();
  });
});
