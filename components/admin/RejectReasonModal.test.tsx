import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { RejectReasonModal } from './RejectReasonModal';

describe('RejectReasonModal', () => {
  it('nút xác nhận bị khóa cho tới khi đủ 20 ký tự, bộ đếm cập nhật', () => {
    const onConfirm = vi.fn();
    renderWithIntl(<RejectReasonModal courseTitle="Khóa A" onConfirm={onConfirm} onClose={vi.fn()} isSubmitting={false} />);
    const confirm = screen.getByRole('button', { name: 'Xác nhận từ chối' });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Lý do từ chối' }), { target: { value: 'Nội dung chưa đạt chuẩn chất lượng' } });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith('Nội dung chưa đạt chuẩn chất lượng');
  });

  it('là hộp thoại có tên, Escape và Hủy đều đóng', () => {
    const onClose = vi.fn();
    renderWithIntl(<RejectReasonModal courseTitle="Khóa A" onConfirm={vi.fn()} onClose={onClose} isSubmitting={false} />);
    expect(screen.getByRole('dialog', { name: 'Từ chối khóa học' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
