import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { PasswordMatchHint, PasswordStrengthMeter } from './PasswordStrengthMeter';

describe('PasswordStrengthMeter', () => {
  it('chưa gõ gì thì không vẽ gì', () => {
    const { container } = renderWithIntl(<PasswordStrengthMeter password="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('hiện nhãn mức độ và báo cho trình đọc màn hình qua role status', () => {
    renderWithIntl(<PasswordStrengthMeter password="Abc12345!" />);
    expect(screen.getByRole('status')).toHaveTextContent('Mức độ bảo mật: Mạnh (tuyệt vời!)');
  });

  it('mật khẩu ngắn hiện cảnh báo quá ngắn', () => {
    renderWithIntl(<PasswordStrengthMeter password="ab" />);
    expect(screen.getByRole('status')).toHaveTextContent('Quá ngắn (tối thiểu 6 ký tự)');
  });
});

describe('PasswordMatchHint', () => {
  it('chưa nhập xác nhận thì không vẽ gì', () => {
    const { container } = renderWithIntl(<PasswordMatchHint password="abc" confirm="" />);
    expect(container).toBeEmptyDOMElement();
  });
  it('khớp và chưa khớp', () => {
    const first = renderWithIntl(<PasswordMatchHint password="abc123" confirm="abc123" />);
    expect(screen.getByText('Mật khẩu khớp')).toBeInTheDocument();
    first.unmount();
    renderWithIntl(<PasswordMatchHint password="abc123" confirm="abc12" />);
    expect(screen.getByText('Mật khẩu chưa khớp')).toBeInTheDocument();
  });
});
