import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { CompletionMeter } from './CompletionMeter';

describe('CompletionMeter', () => {
  it('đủ điều kiện thì báo sẵn sàng gửi duyệt, không có danh sách thiếu', () => {
    renderWithIntl(<CompletionMeter percent={100} missing={[]} />);
    expect(screen.getByText('Sẵn sàng gửi duyệt')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('chưa đủ thì hiện phần trăm và mở danh sách điều kiện còn thiếu khi bấm', () => {
    renderWithIntl(<CompletionMeter percent={60} missing={['Thiếu ảnh bìa', 'Chưa có bài học']} />);
    expect(screen.getByRole('progressbar', { name: 'Tiến độ hoàn thiện khóa học: 60%' })).toHaveAttribute('aria-valuenow', '60');
    const btn = screen.getByRole('button', { name: /Hoàn thiện 60%/ });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Còn thiếu để gửi duyệt')).toBeInTheDocument();
    expect(screen.getByText('Thiếu ảnh bìa')).toBeInTheDocument();
    expect(screen.getByText('Chưa có bài học')).toBeInTheDocument();
  });

  it('Escape đóng danh sách', () => {
    renderWithIntl(<CompletionMeter percent={40} missing={['x']} />);
    const btn = screen.getByRole('button', { name: /Hoàn thiện 40%/ });
    fireEvent.click(btn);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });
});
