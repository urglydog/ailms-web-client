import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { InstructorNavDrawer } from './InstructorNavDrawer';

function setup(open = true) {
  const onClose = vi.fn();
  renderWithIntl(<InstructorNavDrawer open={open} onClose={onClose} pathname="/instructor/bundles" />);
  return onClose;
}

describe('InstructorNavDrawer', () => {
  it('đóng thì không vẽ gì', () => {
    setup(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('mở thì là hộp thoại modal với đủ mục và đánh dấu mục hiện tại', () => {
    setup();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('link', { name: 'Gói khóa học' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Công cụ' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Về trang học viên' })).toHaveAttribute('href', '/');
  });

  it('Escape, nền mờ, nút đóng và bấm liên kết đều đóng ngăn kéo', () => {
    const onClose = setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByTestId('drawer-overlay'));
    fireEvent.click(screen.getByRole('button', { name: 'Đóng menu' }));
    fireEvent.click(screen.getByRole('link', { name: 'Giao tiếp' }));
    expect(onClose).toHaveBeenCalledTimes(4);
  });
});
