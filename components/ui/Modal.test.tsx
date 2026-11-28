import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithIntl } from '@/test/renderWithIntl';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { Modal } from './Modal';

function Harness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Mở
      </button>
      <Modal
        open={open}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        title="Xóa bài học"
        footer={<button type="button">Đồng ý</button>}
      >
        <p>Nội dung</p>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('là hộp thoại có tên lấy từ tiêu đề', () => {
    renderWithIntl(<Harness />);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Mở' }));
    const dialog = screen.getByRole('dialog', { name: 'Xóa bài học' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('focus vào trong khi mở và giữ focus vòng lại khi Tab', () => {
    renderWithIntl(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Mở' }));
    const close = screen.getByRole('button', { name: 'Đóng' });
    const ok = screen.getByRole('button', { name: 'Đồng ý' });
    expect(close).toHaveFocus();
    ok.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(ok).toHaveFocus();
  });

  it('Esc đóng và trả focus về nút đã mở', async () => {
    const onClose = vi.fn();
    renderWithIntl(<Harness onClose={onClose} />);
    const trigger = screen.getByRole('button', { name: 'Mở' });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('khóa cuộn trang nền khi mở', () => {
    renderWithIntl(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Mở' }));
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('đang chạy hiệu ứng thoát thì lớp phủ không nhận chuột (không nuốt cú bấm kế tiếp)', async () => {
    renderWithIntl(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Mở' }));
    const layer = screen.getByRole('dialog').closest('.fixed');
    expect(layer).not.toHaveClass('pointer-events-none');
    fireEvent.keyDown(document, { key: 'Escape' });
    // Lớp phủ vẫn còn trong DOM suốt hiệu ứng thoát nhưng phải xuyên chuột.
    expect(document.body.contains(layer)).toBe(true);
    expect(layer).toHaveClass('pointer-events-none');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
