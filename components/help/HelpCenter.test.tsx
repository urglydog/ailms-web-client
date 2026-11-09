import { fireEvent, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { HelpCenter } from './HelpCenter';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('') }));

beforeAll(() => {
  // jsdom không cài scrollIntoView — form tự cuộn tới khi mở.
  Element.prototype.scrollIntoView = vi.fn();
});

describe('HelpCenter', () => {
  it('chưa chọn nhóm thì không hiện câu hỏi thường gặp', () => {
    renderWithIntl(<HelpCenter />);
    expect(screen.queryByText('Câu hỏi thường gặp')).toBeNull();
  });

  it('chọn nhóm rồi gửi yêu cầu trên 1 vấn đề: tiêu đề tự điền theo mục đã chọn và bị khóa', () => {
    renderWithIntl(<HelpCenter />);
    fireEvent.click(screen.getByRole('button', { name: /Tài khoản & đăng nhập/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /Vấn đề này chưa được giải quyết\? Gửi yêu cầu/ })[1]!);

    expect(screen.getByText('Tài khoản & đăng nhập › Không nhận được mã OTP')).toBeInTheDocument();
    // tiêu đề đã chốt nên không có ô nhập tiêu đề / chọn nhóm
    expect(screen.queryByLabelText('Tiêu đề')).toBeNull();
    expect(screen.getByLabelText(/Mô tả thêm tình huống của bạn/)).toBeInTheDocument();
  });

  it('"Vẫn cần hỗ trợ" mở form tự do với ô tiêu đề để khách tự nhập', () => {
    renderWithIntl(<HelpCenter />);
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu hỗ trợ' }));
    expect(screen.getByLabelText('Tiêu đề')).toBeInTheDocument();
  });
});
